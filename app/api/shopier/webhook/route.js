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
    if (isPaid && buyerEmail) {
      for (const item of lineItems) {
        const pkg = findPackageByName(item.title);
        if (!pkg) continue;

        const id = `${shopierOrderId}:${item.productId}`;
        await prisma.shopierOrder.upsert({
          where: { id },
          update: {},                       // tekrar gelirse dokunma (idempotent)
          create: {
            id,
            productId: String(item.productId),
            productTitle: item.title,
            email: buyerEmail,
            amount: Number(item.total) || pkg.price,
            tokens: pkg.tokens,
          },
        });
      }
    }
  } catch (e) {
    console.error("Webhook kayıt hatası:", e);
  }

  return new Response("ok", { status: 200 });
}