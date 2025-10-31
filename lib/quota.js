// /lib/quota.js
import prisma from "@/lib/prisma";

// Haftayı ISO-8601 haftası olarak anahtarlayalım (YYYY-WW)
function currentWeekKey(date = new Date(), tzOffsetMin = 180) {
  // Europe/Istanbul ~ UTC+3 => 180 dk
  const d = new Date(date.getTime() + tzOffsetMin * 60 * 1000);
  // ISO week
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (tmp.getUTCDay() + 6) % 7;
  tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
  const firstThu = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((tmp - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  const year = tmp.getUTCFullYear();
  return `${year}-${String(week).padStart(2, "0")}`;
}

export async function getActivePlanForUser(userId) {
  // Kullanıcının aktif aboneliği + planı
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    select: {
      id: true,
      plan: {
        select: {
          code: true, // "BASIC", "PRO"...
          analysisPerWeek: true,
          dilekcePerWeek: true,
        },
      },
      currentPeriodEnd: true,
    },
  });

  if (!sub?.plan) {
    // Aboneliği yoksa, kota = 0 (istersen burada FREE tanımı verebilirsin)
    return {
      planCode: "NONE",
      limits: { analysisPerWeek: 0, dilekcePerWeek: 0 },
    };
  }

  return {
    planCode: sub.plan.code,
    limits: {
      analysisPerWeek: sub.plan.analysisPerWeek,
      dilekcePerWeek: sub.plan.dilekcePerWeek,
    },
  };
}

export async function getOrCreateUsageWeek(userId, weekKey = currentWeekKey()) {
  // Unique (userId, periodKey)
  const rec = await prisma.usageWeek.upsert({
    where: { userId_periodKey: { userId, periodKey: weekKey } },
    update: {},
    create: {
      userId,
      periodKey: weekKey,
      analysisUsed: 0,
      dilekceUsed: 0,
    },
    select: { id: true, periodKey: true, analysisUsed: true, dilekceUsed: true },
  });
  return rec;
}

/**
 * Kota kontrolü: tip = "analysis" | "dilekce"
 * return { allowed: boolean, remaining: number, usage }
 */
export async function checkQuota(userId, type) {
  const weekKey = currentWeekKey();
  const [{ planCode, limits }, usage] = await Promise.all([
    getActivePlanForUser(userId),
    getOrCreateUsageWeek(userId, weekKey),
  ]);

  const limit = type === "analysis" ? limits.analysisPerWeek : limits.dilekcePerWeek;
  const used = type === "analysis" ? usage.analysisUsed : usage.dilekceUsed;
  const remaining = Math.max(0, limit - used);

  return {
    planCode,
    allowed: remaining > 0,
    remaining,
    limit,
    weekKey,
    usage,
  };
}

/** Başarılı işlemden sonra 1 artır */
export async function incrementUsage(userId, type) {
  const weekKey = currentWeekKey();
  if (type === "analysis") {
    await prisma.usageWeek.update({
      where: { userId_periodKey: { userId, periodKey: weekKey } },
      data: { analysisUsed: { increment: 1 } },
    });
  } else {
    await prisma.usageWeek.update({
      where: { userId_periodKey: { userId, periodKey: weekKey } },
      data: { dilekceUsed: { increment: 1 } },
    });
  }
}