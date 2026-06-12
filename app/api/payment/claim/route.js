import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Giriş yapmalısınız", { status: 401 });

  const userId = session.user.id;
  if (!userId) return new Response("Oturum eksik", { status: 401 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1) Kullanıcının en son satın alma niyeti (start'ta oluşan PENDING)
      const pending = await tx.payment.findFirst({
        where: { userId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });
      if (!pending) return null;

      // 2) Bu pakete ait (tutar + token aynı), henüz yüklenmemiş bir ödenmiş sipariş
      const order = await tx.shopierOrder.findFirst({
        where: {
          claimed: false,
          tokens: pending.tokenAmount,
          amount: pending.amount,
        },
        orderBy: { createdAt: "desc" },
      });
      if (!order) return null;

      // 3) Atomik: siparişi işaretle, PENDING'i kapat, token'ı yükle
      await tx.shopierOrder.update({
        where: { id: order.id },
        data: { claimed: true, claimedBy: userId },
      });
      await tx.payment.update({
        where: { id: pending.id },
        data: { status: "SUCCESS", paymentId: order.id },
      });
      await tx.user.update({
        where: { id: userId },
        data: { tokenBalance: { increment: order.tokens } },
      });

      return order;
    });

    if (!result) return Response.json({ status: "pending" });
    return Response.json({ status: "success", tokens: result.tokens });
  } catch (e) {
    console.error("claim hatası:", e);
    return new Response("claim error", { status: 500 });
  }
}