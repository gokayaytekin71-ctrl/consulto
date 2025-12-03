import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const body = {};
    formData.forEach((value, key) => (body[key] = value));

    const { status, platform_order_id, payment_id, random_nr, signature, total_order_value, currency } = body;

    // --- KRİTİK DÜZELTME: ONDALIK SAYI FORMATI ---
    // Shopier'ın imza hesaplamasında fiyatı daima 2 ondalık basamakla (Örn: 1.00) kullandığı varsayılır.
    // Gelen total_order_value'yu string'e çevirip, nokta (dot) varsa koruyarak temizleyelim.
    // Veya en basit ve garanti yöntem: Float'a çevir ve 2 ondalık basamak zorla.
    const formattedTotal = Number(total_order_value).toFixed(2);
    // ---------------------------------------------


    // İmza Doğrulama
    const dataToSign =
      String(random_nr) +
      String(platform_order_id) +
      String(formattedTotal) + // <-- FORMATLANMIŞ DEĞER KULLANILDI
      String(currency);

    const expectedSignature = crypto
      .createHmac("sha256", process.env.SHOPIER_API_SECRET)
      .update(dataToSign)
      .digest("base64");

    // Güvenlik Kontrolü
    if (signature !== expectedSignature) {
      console.error("Shopier İmza Hatası!");
      // LOGS: Debug için hangi değerlerin gelip gelmediğini yazmak faydalı olur.
      console.error(`SIGNATURE MISMATCH: Received=${signature.slice(0, 10)}... Expected=${expectedSignature.slice(0, 10)}...`);
      console.error(`Data String Used: ${dataToSign}`);
      
      return new Response("Gecersiz Imza", { status: 400 });
    }

    // Sipariş Bulma
    const payment = await prisma.payment.findUnique({
      where: { orderId: platform_order_id },
    });

    if (!payment) return new Response("Siparis Bulunamadi", { status: 404 });
    if (payment.status === "SUCCESS") return new Response("OK", { status: 200 });

    // Bakiye Yükleme
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
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", paymentId: payment_id },
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Callback Error:", error);
    return new Response("Server Error", { status: 500 });
  }
}