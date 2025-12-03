// lib/tokens.js
import prisma from "@/lib/prisma";

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
      // 1. Güncel bakiyeyi kilitli okuma ile al (race condition önleme)
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { tokenBalance: true },
      });

      if (!user || user.tokenBalance < cost) {
        throw new Error("INSUFFICIENT_TOKENS");
      }

      // 2. Bakiyeyi düş
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { tokenBalance: { decrement: cost } },
        select: { tokenBalance: true }
      });

      // 3. Log kaydı oluştur
      await tx.tokenUsage.create({
        data: {
          userId,
          amount: cost,
          action,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });

      return { 
        ok: true, 
        remaining: updatedUser.tokenBalance 
      };
    });
  } catch (error) {
    if (error.message === "INSUFFICIENT_TOKENS") {
      return { ok: false, error: "Yetersiz token bakiyesi." };
    }
    console.error("Token consumption error:", error);
    return { ok: false, error: "Sunucu hatası." };
  }
}