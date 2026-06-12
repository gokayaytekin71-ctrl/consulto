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

  // 1) İmza doğrulama
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
        // 2) Ürün adından paketi bul
        const pkg = findPackageByName(item.title);
        if (!pkg) continue;

        const id = `${shopierOrderId}:${item.productId}`;

        await prisma.$transaction(async (tx) => {
          // 4a) Daha önce yüklendiyse atla (idempotent)
          const existing = await tx.shopierOrder.findUnique({ where: { id } });
          if (existing?.claimed) return;

          // 3) E-postadan kullanıcıyı bul (büyük/küçük harf duyarsız)
          const user = await tx.user.findFirst({
            where: { email: { equals: buyerEmail, mode: "insensitive" } },
          });

          // 5) Kaydı oluştur/işaretle
          await tx.shopierOrder.upsert({
            where: { id },
            update: { claimed: !!user, claimedBy: user?.id ?? null },
            create: {
              id,
              productId: String(item.productId),
              productTitle: item.title,
              email: buyerEmail,
              amount: Number(item.total) || pkg.price,
              tokens: pkg.tokens,
              claimed: !!user,
              claimedBy: user?.id ?? null,
            },
          });

          // 4b) Token yükle
          if (user) {
            await tx.user.update({
              where: { id: user.id },
              data: { tokenBalance: { increment: pkg.tokens } },
            });
          } else {
            console.warn("Webhook: e-postaya ait kullanıcı yok:", buyerEmail);
          }
        });
      }
    }
  } catch (e) {
    console.error("Webhook işleme hatası:", e);
  }

  return new Response("ok", { status: 200 });
}