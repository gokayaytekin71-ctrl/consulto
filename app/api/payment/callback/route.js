import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const body = {};
    formData.forEach((value, key) => (body[key] = value));

    const { status, platform_order_id, payment_id, random_nr, signature, total_order_value, currency } = body;

    // 1. Fiyatı Formatla (Hem start hem callback'te 2 ondalık basamak zorunludur)
    const formattedTotal = Number(total_order_value).toFixed(2); 

    // 2. İmza Doğrulama String'ini Oluştur (KRİTİK: 4 parametre kullanılır)
    const dataToSign =
      String(random_nr) +
      String(platform_order_id) +
      String(formattedTotal) + // <-- FORMATLANMIŞ FİYAT ZORUNLU
      String(currency);

    const expectedSignature = crypto
      .createHmac("sha256", process.env.SHOPIER_API_SECRET)
      .update(dataToSign)
      .digest("base64");

    // 3. Güvenlik Kontrolü
    if (signature !== expectedSignature) {
      console.error("Shopier İmza Hatası! Alınan İmza Doğrulanamadı.");
      console.error(`İmza İçin Kullanılan String: ${dataToSign}`);
      return new Response("Gecersiz Imza", { status: 400 });
    }

    // 4. DB İşlemi ve Bakiye Yükleme
    const payment = await prisma.payment.findUnique({ where: { orderId: platform_order_id } });

    if (!payment) return new Response("Siparis Bulunamadi", { status: 404 });
    if (payment.status === "SUCCESS") return new Response("OK", { status: 200 });

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

      // !!! KESİN YÖNLENDİRME ÇÖZÜMÜ: HTML Meta Refresh !!!
      const targetUrl = new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'https://www.consultohukuk.com').toString();
      const htmlContent = `
        <html>
        <head>
            <meta http-equiv="refresh" content="0; url=${targetUrl}">
            <script>window.location.replace('${targetUrl}');</script>
        </head>
        <body>Ödeme başarıyla tamamlandı. Yönlendiriliyorsunuz...</body>
        </html>
      `;

      return new Response(htmlContent, {
        status: 200, 
        headers: {
            'Content-Type': 'text/html',
        }
      });
      // !!! YÖNLENDİRME BİTİŞ !!!

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