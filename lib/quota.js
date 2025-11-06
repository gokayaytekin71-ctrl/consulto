// /lib/quota.js
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

// Europe/Istanbul (+03:00) için haftalık anahtar
export function currentWeekKey(date = new Date(), tzOffsetMin = 180) {
  const d = new Date(date.getTime() + tzOffsetMin * 60 * 1000);
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (tmp.getUTCDay() + 6) % 7;
  tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
  const firstThu = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((tmp - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  const year = tmp.getUTCFullYear();
  return `${year}-${String(week).padStart(2, "0")}`;
}

// Kullanıcının aktif planı
export async function getActivePlanForUser(userId) {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    select: {
      id: true,
      status: true,
      SubscriptionPlan: {
        select: {
          code: true,            // "BASIC" | "PRO" | ...
          analysisPerWeek: true,
          dilekcePerWeek: true,
        },
      },
      currentPeriodEnd: true,
    },
  });

  if (!sub?.SubscriptionPlan) {
    // Aboneliği yoksa kota 0
    return {
      planCode: "NONE",
      status: "NONE",
      limits: { analysisPerWeek: 0, dilekcePerWeek: 0 },
    };
  }

  return {
    planCode: sub.SubscriptionPlan.code,
    status: sub.status,
    limits: {
      analysisPerWeek: sub.SubscriptionPlan.analysisPerWeek,
      dilekcePerWeek: sub.SubscriptionPlan.dilekcePerWeek,
    },
  };
}

/** WRITE: Yoksa oluşturur (API'lerde kullan) */
export async function getOrCreateUsageWeek(userId, weekKey = currentWeekKey()) {
  // FK güvenliği: user var mı?
  const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!userExists) {
    // API senaryosunda bu durum kritik—bilerek hata fırlatıyoruz
    throw new Error(`USER_NOT_FOUND for UsageWeek: ${userId}`);
  }

  const rec = await prisma.usageWeek.upsert({
    where: { userId_periodKey: { userId, periodKey: weekKey } },
    update: {},
    create: {
      id: randomUUID(),
      userId,
      periodKey: weekKey,
      analysisUsed: 0,
      dilekceUsed: 0,
    },
    select: { id: true, periodKey: true, analysisUsed: true, dilekceUsed: true },
  });
  return rec;
}

/** READ-ONLY: Sadece mevcut kayıt varsa getirir; yoksa null döner (profilde bunu kullan) */
export async function getUsageSnapshot(userId, weekKey = currentWeekKey()) {
  const usage = await prisma.usageWeek.findUnique({
    where: { userId_periodKey: { userId, periodKey: weekKey } },
    select: { periodKey: true, analysisUsed: true, dilekceUsed: true },
  });
  return usage || { periodKey: weekKey, analysisUsed: 0, dilekceUsed: 0 };
}

/** WRITE: API kotası için (mevcut davranış korunur) */
export async function checkQuota(userId, type) {
  const weekKey = currentWeekKey();

  const [{ planCode, status, limits }, usage] = await Promise.all([
    getActivePlanForUser(userId),
    getOrCreateUsageWeek(userId, weekKey),  // <- yazma/upsert
  ]);

  const limit = type === "analysis" ? limits.analysisPerWeek : limits.dilekcePerWeek;
  const used  = type === "analysis" ? usage.analysisUsed : usage.dilekceUsed;
  const remaining = Math.max(0, limit - used);

  return { planCode, status, allowed: remaining > 0, remaining, limit, weekKey, usage };
}

/** READ-ONLY: Profil gibi sadece gösterim için (upsert YOK) */
export async function checkQuotaReadOnly(userId, type) {
  const weekKey = currentWeekKey();

  const [{ planCode, status, limits }, usage] = await Promise.all([
    getActivePlanForUser(userId),
    getUsageSnapshot(userId, weekKey),       // <- sadece select
  ]);

  const limit = type === "analysis" ? (limits.analysisPerWeek ?? 0) : (limits.dilekcePerWeek ?? 0);
  const used  = type === "analysis" ? (usage?.analysisUsed ?? 0)     : (usage?.dilekceUsed ?? 0);
  const remaining = Math.max(0, limit - used);

  return { planCode, status, remaining, limit, weekKey, usage };
}

/** WRITE: başarılı işlemden sonra sayaç artır (API'lerde) */
export async function incrementUsage(userId, type) {
  const weekKey = currentWeekKey();

  // FK güvenliği: user var mı?
  const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!userExists) {
    throw new Error(`USER_NOT_FOUND for UsageWeek increment: ${userId}`);
  }

  // Ensure row exists (upsert)
  await prisma.usageWeek.upsert({
    where: { userId_periodKey: { userId, periodKey: weekKey } },
    update: {},
    create: {
      id: randomUUID(),
      userId,
      periodKey: weekKey,
      analysisUsed: 0,
      dilekceUsed: 0,
    },
  });

  // Sonra ilgili alanı artır
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