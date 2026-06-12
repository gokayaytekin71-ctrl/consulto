import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { PACKAGES } from "@/lib/packages";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Giriş yapmalısınız", { status: 401 });

  const { packageId } = await req.json();
  const pkg = PACKAGES[packageId];
  if (!pkg) return new Response("Geçersiz paket", { status: 400 });

  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  await prisma.payment.create({
    data: {
      id: crypto.randomUUID(),
      userId: session.user.id,
      orderId,
      amount: pkg.price,
      tokenAmount: pkg.tokens,
      status: "PENDING",
    },
  });

  return Response.json({ redirectUrl: pkg.shopierUrl });
}