// app/api/shopier/webhook/route.js
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { findPackageByName } from "@/lib/packages";

export const dynamic = "force-dynamic";

function safeEqual(a, b) {
  const ab = Buffer.from(a || "", "utf8");
  const bb = Buffer.from(b || "", "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req) {
  // 1) HAM gövde (imza parse edilmemiş gövde üzerinden hesaplanır — kritik)
  const rawBody = await req.text();
  const signature = req.headers.get("shopier-signature") || "";

  // 2) HS256 doğrulama
  const token = process.env.SHOPIER_WEBHOOK_TOKEN;
  const b64 = crypto.createHmac("sha256", token).update(rawBody).digest("base64");
  const hex = crypto.createHmac("sha256", token).update(rawBody).digest("hex");

  if (!safeEqual(signature, b64) && !safeEqual(signature, hex)) {
    console.error("Shopier webhook imza doğrulanamadı");
    return new Response("invalid signature", { status: 401 });
  }

  // 3) Parse
  let event = {};
  try { event = JSON.parse(rawBody); } catch {}

  // ⚠️ İLK KURULUMDA bir gerçek ödeme yap ve şu log'a bak; alan adlarını buradan kesinleştir:
  console.log("SHOPIER WEBHOOK PAYLOAD:", JSON.stringify(event));

  // 4) Alanları çıkar (adları payload log'una göre düzelt)
  const shopierOrderId = event.order_id ?? event.id;            // Shopier'in kendi sipariş id'si
  const buyerEmail     = event.buyer?.email ?? event.email;     // alıcı e-postası
  const productName    = event.product_name ?? event.product?.name;
  const isPaid         = (event.status ?? event.payment_status) === "success"; // ⚠️ doğrula

  try {
    if (isPaid && buyerEmail && productName) {
      const user = await prisma.user.findFirst({ where: { email: buyerEmail } });
      const pkg  = findPackageByName(productName);

      if (user && pkg) {
        // İdempotensi: aynı Shopier siparişi tekrar gelirse iki kez yükleme
        const already = await prisma.payment.findFirst({
          where: { userId: user.id, paymentId: String(shopierOrderId), status: "SUCCESS" },
        });

        if (!already) {
          // Bu kullanıcının bu pakete ait en son PENDING kaydını bul
          const pending = await prisma.payment.findFirst({
            where: { userId: user.id, tokenAmount: pkg.tokens, status: "PENDING" },
            orderBy: { createdAt: "desc" },
          });

          await prisma.$transaction([
            ...(pending
              ? [prisma.payment.update({
                  where: { id: pending.id },
                  data: { status: "SUCCESS", paymentId: String(shopierOrderId) },
                })]
              : []),
            prisma.user.update({
              where: { id: user.id },
              data: { tokenBalance: { increment: pkg.tokens } },
            }),
          ]);
        }
      }
    }
  } catch (e) {
    console.error("Webhook işleme hatası:", e);
    // Yine de 200 dönüyoruz; tekrar denemelerle çift yükleme olmasın diye idempotensi var.
  }

  // 5) HER ZAMAN hızlıca 200 dön (5 sn kuralı)
  return new Response("ok", { status: 200 });
}