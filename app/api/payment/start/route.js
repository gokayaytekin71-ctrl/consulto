import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const PACKAGES = {
  1: { tokens: 5, price: 150, name: "5 Token Paketi" }, 
  2: { tokens: 25, price: 500, name: "25 Token Paketi" },
  3: { tokens: 50, price: 850, name: "50 Token Paketi" },
  4: { tokens: 99999, price: 1500, name: "3 Aylık Sınırsız Erişim Paketi" }, 
  5: { tokens: 99999, price: 2500, name: "6 Aylık Sınırsız Erişim Paketi" },
  6: { tokens: 99999, price: 4000, name: "1 Yıllık Sınırsız Erişim Paketi Paketi" },
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Giriş yapmalısınız", { status: 401 });

    const { packageId } = await req.json();
    const selectedPkg = PACKAGES[packageId];
    if (!selectedPkg) return new Response("Geçersiz paket", { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (!process.env.SHOPIER_API_KEY || !process.env.SHOPIER_API_SECRET) {
      console.error("SHOPIER API ANAHTARLARI EKSİK!");
      return new Response("Sunucu yapılandırma hatası (Shopier Keys Missing)", { status: 500 });
    }

    // Fiyatı 2 ondalık basamağa ("100.00") formatla (İmza tutarlılığı için)
    const formattedPrice = Number(selectedPkg.price).toFixed(2); 

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // DB Kaydı
    await prisma.payment.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        orderId,
        amount: selectedPkg.price, 
        tokenAmount: selectedPkg.tokens,
        status: "PENDING",
      },
    });

    const randomNr = Math.floor(Math.random() * 1000000);

    // Shopier Parametreleri
    const args = {
      API_key: process.env.SHOPIER_API_KEY, 
      website_index: 2, // <-- KRİTİK DÜZELTME: Artık 2. URL'yi (redirector) kullan
      platform_order_id: orderId,
      product_name: selectedPkg.name,
      product_type: 1, 
      buyer_name: user.name || "Kullanici",
      buyer_surname: "Musteri",
      buyer_email: user.email || "info@consultohukuk.com",
      buyer_account_age: 0,
      buyer_id_nr: 0,

      
      billing_address: "Dijital Ürün",
      billing_city: "Istanbul",
      billing_country: "TR",
      billing_postcode: "34000",
      shipping_address: "Dijital Ürün",
      shipping_city: "Istanbul",
      shipping_country: "TR",
      shipping_postcode: "34000",
      
      total_order_value: formattedPrice, // Formatlanmış fiyatı gönder ("100.00")
      currency: 0, 
      platform: 0,
      is_in_frame: 0,
      current_language: 0,
      modul_version: "1.0.4",
      random_nr: randomNr,
    };

    // İmza Oluşturma
    const dataToSign =
      String(args.random_nr) +
      String(args.platform_order_id) +
      String(args.total_order_value) +
      String(args.currency);

    const signature = crypto
      .createHmac("sha256", process.env.SHOPIER_API_SECRET)
      .update(dataToSign)
      .digest("base64");

    args.signature = signature;
    
    // Yönlendirme Formu
    const formInputs = Object.entries(args)
      .map(([key, val]) => `<input type="hidden" name="${key}" value="${val}">`)
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Yönlendiriliyor...</title></head>
      <body onload="document.forms[0].submit()">
        <form action="https://www.shopier.com/ShowProduct/api_pay4.php" method="post">
          ${formInputs}
        </form>
      </body>
      </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html" } });
  } catch (err) {
    console.error("KRİTİK HATA: DB CREATE BAŞARISIZ OLDU:", err);
    return new Response("Veritabanı bağlantı hatası veya sunucu hatası.", { status: 500 });
  }
}