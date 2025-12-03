import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const PACKAGES = {
  1: { tokens: 10, price: 100, name: "10 Token Paketi" },
  2: { tokens: 50, price: 400, name: "50 Token Paketi" },
  3: { tokens: 100, price: 700, name: "100 Token Paketi" },
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Giriş yapmalısınız", { status: 401 });

    const { packageId } = await req.json();
    const selectedPkg = PACKAGES[packageId];

    if (!selectedPkg) return new Response("Geçersiz paket", { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    
    // API Anahtarlarını Kontrol Et (Loglarda görebilmek için)
    if (!process.env.SHOPIER_API_KEY || !process.env.SHOPIER_API_SECRET) {
        console.error("SHOPIER API ANAHTARLARI EKSİK!");
        return new Response("Server Config Error", { status: 500 });
    }

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // DB'ye kaydet (ID manuel veriyoruz, hata almamak için)
    await prisma.payment.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        orderId: orderId,
        amount: selectedPkg.price,
        tokenAmount: selectedPkg.tokens,
        status: "PENDING",
      },
    });

    // Shopier Parametreleri
    const args = {
      API_KEY: process.env.SHOPIER_API_KEY,
      website_index: 1,
      platform_order_id: orderId,
      product_name: selectedPkg.name,
      product_type: 1, 
      buyer_name: user.name || "Kullanici",
      buyer_surname: "Musteri",
      buyer_email: user.email || "info@consultohukuk.com",
      buyer_account_age: 0,
      buyer_id_nr: 11111111111,
      buyer_phone: "05555555555",
      billing_address: "Dijital Teslimat",
      billing_city: "Istanbul",
      billing_country: "TR",
      billing_postcode: "34000",
      shipping_address: "Dijital Teslimat",
      shipping_city: "Istanbul",
      shipping_country: "TR",
      shipping_postcode: "34000",
      currency: 0,
      data: selectedPkg.price, // Fiyat
      modul_version: "1.0.4",
      random_nr: Math.floor(Math.random() * 1000000),
    };

    // 4. İMZA OLUŞTURMA (KRİTİK BÖLÜM)
    // Shopier dokümanına göre: random_nr + platform_order_id + data + currency
    // ÖNEMLİ: Hepsi String olarak birleştirilmeli
    const dataString = String(args.random_nr) + String(args.platform_order_id) + String(args.data) + String(args.currency);
    
    const signature = crypto
      .createHmac("sha256", process.env.SHOPIER_API_SECRET)
      .update(dataString)
      .digest("base64");

    args.signature = signature;
    args.callback = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`;

    // Formu Gönder
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
    console.error("Payment Start Error:", err);
    return new Response("Ödeme başlatılamadı", { status: 500 });
  }
}