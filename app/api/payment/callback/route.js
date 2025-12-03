import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const body = {};
    formData.forEach((value, key) => (body[key] = value));

    // Güvenli değişken ataması: Gelmezse '0' varsay (Fiyat ve Para Birimi için)
    const status = body.status;
    const platform_order_id = body.platform_order_id;
    const payment_id = body.payment_id;
    const random_nr = body.random_nr;
    const signature = body.signature;
    
    // Fiyatı ve para birimini yakala. total_order_value gelmezse 0 varsay (NaN hatasını önler).
    const rawTotal = body.total_order_value || body.payment_amount || '0'; 
    const rawCurrency = body.currency || '0'; 
    
    // --- KRİTİK DÜZELTME: Formatlama ---
    // Gelen ham fiyatı (örn: "100" veya "100.00"), kesinlikle 2 ondalık basamağa formatla.
    const formattedTotal = Number(rawTotal).toFixed(2); 
    // -----------------------------------

    // 1. İmza Doğrulama String'ini Oluştur
    const dataToSign =
      String(random_nr) +
      String(platform_order_id) +
      String(formattedTotal) + 
      String(rawCurrency);

    const expectedSignature = crypto
      .createHmac("sha256", process.env.SHOPIER_API_SECRET)
      .update(dataToSign)
      .digest("base64");

    // 2. Güvenlik Kontrolü
    if (signature !== expectedSignature) {
      console.error("Shopier İmza Hatası! Alınan İmza Doğrulanamadı.");
      console.error(`Data String Used: ${dataToSign}`);
      console.error(`Fiyat (Ham/Formatlı): ${rawTotal} / ${formattedTotal}`);
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
    } else {
      // Başarısız olursa durumu günceller
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", paymentId: payment_id },
      });
    }

    // 5. Shopier'e başarılı yanıt gönder
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Callback Critical Error:", error);
    return new Response("Server Error", { status: 500 });
  }
}