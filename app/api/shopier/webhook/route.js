import prisma from "@/lib/prisma";
import crypto from "crypto";
import { findPackageByName } from "@/lib/packages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeEqual(a, b) {
  const ab = Buffer.from(a || "", "utf8");
  const bb = Buffer.from(b || "", "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("shopier-signature") || "";

  const token = process.env.SHOPIER_WEBHOOK_TOKEN;
  const hex = crypto.createHmac("sha256", token).update(rawBody).digest("hex");
  const b64 = crypto.createHmac("sha256", token).update(rawBody).digest("base64");

  if (!safeEqual(signature, hex) && !safeEqual(signature, b64)) {
    console.error("Shopier webhook imza doğrulanamadı");
    return new Response("invalid signature", { status: 401 });
  }

  let event = {};
  try { event = JSON.parse(rawBody); } catch {}

  const shopierOrderId = String(event.id);
  const buyerEmail = event.shippingInfo?.email ?? event.billingInfo?.email;
  const isPaid = event.paymentStatus === "paid";
  const lineItems = Array.isArray(event.lineItems) ? event.lineItems : [];

  try {
    if (isPaid && buyerEmail && lineItems.length) {
      const user = await prisma.user.findFirst({ where: { email: buyerEmail } });

      if (!user) {
        console.warn("Webhook: kullanıcı bulunamadı, email:", buyerEmail);
        return new Response("ok", { status: 200 });
      }

      for (const item of lineItems) {
        const pkg = findPackageByName(item.title);
        if (!pkg) continue;

        const dedupeId = `${shopierOrderId}:${item.productId}`;

        // İdempotensi: aynı sipariş+ürün tekrar gelirse iki kez yükleme
        const already = await prisma.payment.findFirst({
          where: { userId: user.id, paymentId: dedupeId, status: "SUCCESS" },
        });
        if (already) continue;

        const qty = Number(item.quantity) || 1;

        const pending = await prisma.payment.findFirst({
          where: { userId: user.id, tokenAmount: pkg.tokens, status: "PENDING" },
          orderBy: { createdAt: "desc" },
        });

        await prisma.$transaction([
          pending
            ? prisma.payment.update({
                where: { id: pending.id },
                data: { status: "SUCCESS", paymentId: dedupeId },
              })
            : prisma.payment.create({
                data: {
                  id: crypto.randomUUID(),
                  userId: user.id,
                  orderId: `SHOPIER-${dedupeId}`,
                  paymentId: dedupeId,
                  amount: Number(item.total) || pkg.price,
                  tokenAmount: pkg.tokens,
                  status: "SUCCESS",
                },
              }),
          prisma.user.update({
            where: { id: user.id },
            data: { tokenBalance: { increment: pkg.tokens * qty } },
          }),
        ]);
      }
    }
  } catch (e) {
    console.error("Webhook işleme hatası:", e);
  }

  return new Response("ok", { status: 200 });
}