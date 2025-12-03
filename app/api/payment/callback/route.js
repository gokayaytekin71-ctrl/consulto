import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const body = {};
    formData.forEach((value, key) => (body[key] = value));

    const { status, platform_order_id, payment_id, random_nr, signature } = body;

    // 1. İmza Doğrulama (Güvenlik)
    const expectedData = random_nr + platform_order_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.SHOPIER_API_SECRET)
      .update(expectedData)
      .digest("base64");

    if (signature !== expectedSignature) {
      console.error("Shopier imza hatası!");
      return new Response("Gecersiz Imza", { status: 400 });
    }

    // 2. Siparişi Bul
    const payment = await prisma.payment.findUnique({
      where: { orderId: platform_order_id },
    });

    if (!payment) return new Response("Siparis Bulunamadi", { status: 404 });
    if (payment.status === "SUCCESS") return new Response("OK", { status: 200 });

    // 3. Başarılıysa Token Yükle
    if (status && status.toLowerCase() === "success") {
      await prisma.$transaction([
        // Ödemeyi güncelle
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCESS", paymentId: payment_id },
        }),
        // Kullanıcıya token ekle
        prisma.user.update({
          where: { id: payment.userId },
          data: { tokenBalance: { increment: payment.tokenAmount } },
        }),
      ]);
    } else {
      // Başarısızsa güncelle
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Callback Error:", error);
    return new Response("Server Error", { status: 500 });
  }
}