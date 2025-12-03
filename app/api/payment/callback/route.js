import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const body = {};
    formData.forEach((value, key) => (body[key] = value));

    const { status, platform_order_id, payment_id, random_nr, signature, total_order_value, currency } = body;

    // --- FİYAT VE CURRENCY KALDIRILDI (Son Deneme Fix) ---
    // Shopier'ın callback imza kuralı sadece ID'ler üzerinden yürütülüyor olmalı.
    const dataToSign =
      String(random_nr) +
      String(platform_order_id); 
    // ----------------------------------------------------

    const expectedSignature = crypto
      .createHmac("sha256", process.env.SHOPIER_API_SECRET)
      .update(dataToSign)
      .digest("base64");

    // Güvenlik Kontrolü
    if (signature !== expectedSignature) {
      console.error("Shopier İmza Hatası! Alınan İmza Doğrulanamadı.");
      // Hata olduğunda sade bir hata mesajı gösterelim
      const errorHtml = `
        <body style="background:#111827; color:#fff; font-family:sans-serif; text-align:center; padding-top:10vh;">
            <h1 style="color:#f87171;">❌ Ödeme Doğrulaması Başarısız!</h1>
            <p style="color:#9ca3af;">Güvenlik imzası eşleşmediği için işlem iptal edildi. Lütfen destek ekibiyle iletişime geçiniz.</p>
            <a href="/" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#4f46e5; border-radius:8px; color:white; text-decoration:none;">Ana Sayfaya Dön</a>
        </body>
      `;
      return new Response(errorHtml, { status: 400, headers: {'Content-Type': 'text/html'} });
    }

    // 3. Sipariş Bulma
    const payment = await prisma.payment.findUnique({
      where: { orderId: platform_order_id },
    });

    if (!payment) {
        const errorHtml = `
        <body style="background:#111827; color:#fff; font-family:sans-serif; text-align:center; padding-top:10vh;">
            <h1 style="color:#f87171;">⚠️ Sipariş Bulunamadı (404)</h1>
            <p style="color:#9ca3af;">Ödeme veritabanına işlenemedi. Lütfen destek ile iletişime geçiniz.</p>
        </body>
        `;
        return new Response(errorHtml, { status: 404, headers: {'Content-Type': 'text/html'} });
    }

    // 4. Bakiye Yükleme ve HTML Yanıtı
    if (status && status.toLowerCase() === "success") {
      // Bakiye yükleme işlemini yap
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

      // !!! BAŞARILI HTML SAYFASI !!!
      const homeUrl = "/"; // Next.js otomatik çözecektir
      const successHtml = `
        <body style="background:#111827; color:#fff; font-family:sans-serif; text-align:center; padding-top:10vh;">
            <h1 style="color:#34d399;">✅ Ödeme Başarılı!</h1>
            <p style="color:#9ca3af;">Hesabınıza ${payment.tokenAmount} Token başarıyla yüklendi.</p>
            <a href="${homeUrl}" style="display:inline-block; margin-top:30px; padding:10px 20px; background:#3b82f6; border-radius:8px; color:white; text-decoration:none; font-weight:bold;">
                👉 Ana Sayfaya ve Analiz Botuna Dön
            </a>
            <p style="margin-top:10px; color:#6b7280; font-size:12px;">Bu sayfayı kapatabilirsiniz.</p>
        </body>
      `;
      return new Response(successHtml, { status: 200, headers: {'Content-Type': 'text/html'} });
    } else {
      // Başarısız olursa durumu günceller
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", paymentId: payment_id },
      });
      
      const failureHtml = `
        <body style="background:#111827; color:#fff; font-family:sans-serif; text-align:center; padding-top:10vh;">
            <h1 style="color:#f87171;">❌ Ödeme Başarısız veya İptal Edildi.</h1>
            <p style="color:#9ca3af;">Bakiyeniz yüklenemedi. Lütfen bankanızla iletişime geçiniz.</p>
            <a href="/" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#4f46e5; border-radius:8px; color:white; text-decoration:none;">Ana Sayfaya Dön</a>
        </body>
      `;
      return new Response(failureHtml, { status: 200, headers: {'Content-Type': 'text/html'} });
    }
  } catch (error) {
    console.error("Callback Critical Error:", error);
    return new Response("Server Error", { status: 500 });
  }
}