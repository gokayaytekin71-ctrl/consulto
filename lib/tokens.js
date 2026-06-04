import prisma from "@/lib/prisma";
import crypto from "crypto";

/**
 * Kullanıcının yeterli tokeni var mı kontrol eder.
 * @param {string} userId 
 * @param {number} cost - İşlem maliyeti (varsayılan 1)
 */
export async function checkTokenBalance(userId, cost = 1) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenBalance: true },
  });

  if (!user) return { ok: false, balance: 0, message: "Kullanıcı bulunamadı." };

  if (user.tokenBalance >= cost) {
    return { ok: true, balance: user.tokenBalance };
  } else {
    return { ok: false, balance: user.tokenBalance, message: "Yetersiz bakiye." };
  }
}

/**
 * Token harcar (Atomic Transaction ile).
 * @param {string} userId
 * @param {string} action - "ANALYSIS" veya "DILEKCE"
 * @param {number} cost - Düşülecek miktar (varsayılan 1)
 */
export async function consumeToken(userId, action, cost = 1, metadata = null) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Token yeterliyse tek hamlede düşür.
      // Aynı anda iki istek gelirse, tokenBalance >= cost şartı sayesinde
      // bakiye eksiye düşmez ve race condition oluşmaz.
      const updated = await tx.user.updateMany({
        where: {
          id: userId,
          tokenBalance: {
            gte: cost,
          },
        },
        data: {
          tokenBalance: {
            decrement: cost,
          },
        },
      });

      if (updated.count === 0) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { tokenBalance: true },
        });

        return {
          ok: false,
          error: "Yetersiz token bakiyesi.",
          remaining: user?.tokenBalance ?? 0,
        };
      }

      // 2. Güncel bakiyeyi al.
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { tokenBalance: true },
      });

      // 3. Kullanımı logla.
      await tx.tokenUsage.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          amount: cost,
          action,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      return {
        ok: true,
        remaining: user?.tokenBalance ?? 0,
      };
    });
  } catch (error) {
    console.error("Token consumption error:", error);
    return { ok: false, error: "Sunucu hatası.", remaining: 0 };
  }
}