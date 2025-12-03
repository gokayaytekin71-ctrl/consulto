import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const body = {};
    formData.forEach((value, key) => (body[key] = value));

    const { status, platform_order_id, payment_id, random_nr, signature, total_order_value, currency } = body;

    // --- FİYAT VE CURRENCY KALDIRILDI ---
    // Shopier'ın callback imza kuralı sadece ID'ler üzerinden yürütülüyor olmalı.
    const dataToSign =
      String(random_nr) +
      String(platform_order_id); 
      // ----------------------------------

    const expectedSignature = crypto
      .createHmac("sha256", process.env.SHOPIER_API_SECRET)
      .update(dataToSign)
      .digest("base64");

    // Güvenlik Kontrolü
    if (signature !== expectedSignature) {
      console.error("Shopier İmza Hatası! Alınan İmza Doğrulanamadı.");
      console.error(`İmza İçin Kullanılan String: ${dataToSign}`);
      console.error(`Gelen/Hesaplanan İmza Farkı: Received=${signature.slice(0, 10)}... Expected=${expectedSignature.slice(0, 10)}...`);

      // Eğer imza tutmazsa işlemi durdur
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