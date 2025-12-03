import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const body = {};
    formData.forEach((value, key) => {
      body[key] = value;
    });

    const {
      status,
      platform_order_id,
      payment_id,
      random_nr,
      signature,
      total_order_value,
      currency,
    } = body;

    // ---- İMZA DOĞRULAMA ----
    const dataToSign =
      String(random_nr) +
      String(platform_order_id) +
      String(total_order_value) +
      String(currency);

    const expectedSigBuffer = crypto
      .createHmac("sha256", process.env.SHOPIER_API_SECRET)
      .update(dataToSign)
      .digest(); // Buffer

    const incomingSigBuffer = Buffer.from(signature, "base64");

    // timingSafeEqual kullanmak daha güvenli
    const isValid =
      incomingSigBuffer.length === expectedSigBuffer.length &&
      crypto.timingSafeEqual(incomingSigBuffer, expectedSigBuffer);

    if (!isValid) {
      console.error("Shopier imza hatası!");
      return new Response("Gecersiz Imza", { status: 400 });
    }

    // ---- SİPARİŞİ BUL ----
    const payment = await prisma.payment.findUnique({
      where: { orderId: platform_order_id },
    });

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
    } else {
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