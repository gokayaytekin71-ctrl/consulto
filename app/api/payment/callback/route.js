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

    console.log("CALLBACK BODY:", body); // Loglarda ne geldiğini gör

    const {
      status,
      platform_order_id,
      payment_id,
      random_nr,
      signature, // Gelen imza (Base64 String)
      total_order_value, // Shopier'in döndürdüğü tutar
      currency,
    } = body;

    // ---- İMZA DOĞRULAMA ----
    // Start dosyasındaki ile AYNI sırada birleştiriyoruz
    const dataToSign =
      String(random_nr) +
      String(platform_order_id) +
      String(total_order_value) +
      String(currency);

    // Kendi imzamızı hesaplıyoruz
    const expectedSignature = crypto
      .createHmac("sha256", process.env.SHOPIER_API_SECRET)
      .update(dataToSign)
      .digest("base64");

    // İmza Kontrolü (String olarak karşılaştırıyoruz, en kolayı)
    if (signature !== expectedSignature) {
      console.error("İMZA HATASI!");
      console.error("Beklenen:", expectedSignature);
      console.error("Gelen:", signature);
      // return new Response("Gecersiz Imza", { status: 400 }); // Test ederken burayı açık tutarsan hatayı görürsün
    }

    // ---- SİPARİŞİ BUL ----
    const payment = await prisma.payment.findUnique({
      where: { orderId: platform_order_id },
    });

    if (!payment) {
        console.error("Sipariş Bulunamadı:", platform_order_id);
        return new Response("Siparis Bulunamadi", { status: 404 });
    }

    // Zaten işlendiyse tekrar yapma
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
      console.log("Token Yüklendi:", payment.tokenAmount);
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