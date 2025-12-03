import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const body = {};
    formData.forEach((value, key) => (body[key] = value));

    // KRİTİK: total_order_value ve currency'ye güvenli varsayılan değer atıyoruz
    const platform_order_id = body.platform_order_id;
    const random_nr = body.random_nr;
    const signature = body.signature;
    const payment_id = body.payment_id;
    const status = body.status;
    
    // Güvenli Fiyat ve Kur Çıkarımı: Değer gelmezse 0 varsay
    const rawTotal = body.total_order_value || body.payment_amount || 0; 
    const rawCurrency = body.currency || 0; 
    
    // Fiyatı 2 ondalık basamağa formatla (Örn: 100 -> "100.00")
    const formattedTotal = Number(rawTotal).toFixed(2); 

    // 1. İmza Doğrulama String'ini Oluştur (4 Parametre Zorunlu)
    const dataToSign =
      String(random_nr) +
      String(platform_order_id) +
      String(formattedTotal) + // <-- "100.00" stringi ile imzalıyoruz
      String(rawCurrency);

    const expectedSignature = crypto
      .createHmac("sha256", process.env.SHOPIER_API_SECRET)
      .update(dataToSign)
      .digest("base64");

    // 2. Güvenlik Kontrolü
    if (signature !== expectedSignature) {
      console.error("Shopier İmza Hatası! Alınan İmza Doğrulanamadı.");
      console.error(`Gelen Tutar: ${rawTotal}, Formatlanan Tutar: ${formattedTotal}`);
      console.error(`İmza İçin Kullanılan String: ${dataToSign}`);
      return new Response("Gecersiz Imza", { status: 400 });
    }

    // 3. Sipariş Bulma
    const payment = await prisma.payment.findUnique({
      where: { orderId: platform_order_id },
    });

    if (!payment) return new Response("Siparis Bulunamadi", { status: 404 });
    if (payment.status === "SUCCESS") return new Response("OK", { status: 200 });

    // 4. Bakiye Yükleme
    if (status && status.toLowerCase() === "success") {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCESS", paymentId: payment_id },
        }),
        prisma.user.update({
          where: { id: payment.userId },
          data: { tokenBalance: { increment: payment.tokenAmount } },
        }),
      ]);

      // Başarılı işlem sonrası Shopier'a OK döndürülür.
      return new Response("OK", { status: 200 }); 

    } else {
      // Başarısız olursa durumu günceller
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", paymentId: payment_id },
      });
    }

    // Başarısız işlem sonrası Shopier'a OK döner
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Callback Critical Error:", error);
    return new Response("Server Error", { status: 500 });
  }
}