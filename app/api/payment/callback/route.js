// app/api/payment/callback/route.js
import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const body = {};
    formData.forEach((value, key) => (body[key] = value));

    const { status, platform_order_id, payment_id, random_nr, signature, total_order_value, currency } = body;

    // Fiyat formatlama (Önceki adımda çözüldü)
    const formattedTotal = Number(total_order_value).toFixed(2); 

    // İmza Doğrulama
    const dataToSign = String(random_nr) + String(platform_order_id) + String(formattedTotal) + String(currency);

    const expectedSignature = crypto
      .createHmac("sha256", process.env.SHOPIER_API_SECRET)
      .update(dataToSign)
      .digest("base64");

    if (signature !== expectedSignature) {
      console.error("Shopier İmza Hatası! Alınan İmza Doğrulanamadı.");
      return new Response("Gecersiz Imza", { status: 400 });
    }

    // Sipariş Bulma
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

      // !!! KRİTİK ÇÖZÜM: HTML YÖNLENDİRME (REDIRECT) !!!
      const targetUrl = new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'https://www.consultohukuk.com').toString();

      const htmlContent = `
        <html>
        <head>
            <meta http-equiv="refresh" content="0; url=${targetUrl}">
            <script>
                // Fallback JS redirect
                window.location.replace('${targetUrl}');
            </script>
        </head>
        <body>
            Ödeme başarıyla tamamlandı. Ana sayfaya yönlendiriliyorsunuz...
        </body>
        </html>
      `;

      // Shopier'a 200 OK gönderilir, tarayıcı HTML'i okuyup yönlenir.
      return new Response(htmlContent, {
        status: 200, 
        headers: {
            'Content-Type': 'text/html',
        }
      });
      // !!! YÖNLENDİRME BİTİŞ !!!

    } else {
      // Başarısız olursa sadece OK döner, tarayıcıda kalır
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", paymentId: payment_id },
      });
    }

    // Başarısız işlem sonrası Shopier'a OK döner (kullanıcı callback sayfasında kalır)
    return new Response("OK", { status: 200 }); 
  } catch (error) {
    console.error("Callback Critical Error:", error);
    return new Response("Server Error", { status: 500 });
  }
}