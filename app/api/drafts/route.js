import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Prisma singleton (dev'de bağlantı şişmesini önler)
const g = globalThis;
const prisma = g.__prisma__ || new PrismaClient();
if (process.env.NODE_ENV !== "production") g.__prisma__ = prisma;

// ---------- helpers ----------
function normalizeDayanaklar(v) {
  const set = new Set();
  for (const x of (Array.isArray(v) ? v : [])) {
    const s = String(x || "").trim();
    if (s) set.add(s);
  }
  return Array.from(set);
}

function mergeKaynaklarAndDayanaklar(kaynaklar, dayanaklarArr) {
  if (!Array.isArray(dayanaklarArr) || !dayanaklarArr.length) return kaynaklar ?? null;
  if (kaynaklar && typeof kaynaklar === "object") {
    return { ...kaynaklar, dayanaklar: dayanaklarArr };
  }
  return { dayanaklar: dayanaklarArr };
}

// ---------- GET ----------
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED_DRAFTS",
          message: "Taslakları görmek için giriş yapmalısınız.",
          requireLogin: true,
          type: "drafts",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || 6);
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 6;

    const items = await prisma.draft.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: safeLimit,
    });

    const withDayanak = items.map((d) => {
      const src1 = Array.isArray(d?.dayanaklar) ? d.dayanaklar : [];
      const src2 = (d?.kaynaklar && Array.isArray(d.kaynaklar.dayanaklar)) ? d.kaynaklar.dayanaklar : [];
      const src3 = (d?.dilekce_json && Array.isArray(d.dilekce_json.dayanaklar)) ? d.dilekce_json.dayanaklar : [];
      const merged = normalizeDayanaklar([...src1, ...src2, ...src3]);
      return { ...d, dayanaklar: merged };
    });

    return NextResponse.json({ items: withDayanak });
  } catch (e) {
    console.error("GET /api/drafts error:", e);
    return NextResponse.json({ error: "Listelenemedi" }, { status: 500 });
  }
}

// ---------- POST ----------
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED_DRAFTS",
          message: "Taslak kaydetmek için giriş yapmalısınız.",
          requireLogin: true,
          type: "drafts",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await req.json();
    const {
      dava_turu,
      olay_ozet,
      talep,
      dilekce_md,
      kaynaklar,
      girdi_ozeti,
      // UI’dan gelebilir:
      dayanaklar,
      dilekce,
      dilekce_json,
    } = body || {};

    if (!dilekce_md || typeof dilekce_md !== "string" || !dilekce_md.trim()) {
      return NextResponse.json({ error: "dilekce_md zorunlu" }, { status: 400 });
    }

    const dayArr = normalizeDayanaklar(
      dayanaklar ?? dilekce?.dayanaklar ?? dilekce_json?.dayanaklar
    );

    const kaynaklarToSave = mergeKaynaklarAndDayanaklar(kaynaklar ?? null, dayArr);

    // ŞEMADA OLAN alanlarla kaydı oluştur
    const created = await prisma.draft.create({
      data: {
        userId,
        dava_turu: dava_turu || null,
        olay_ozet: olay_ozet || null,
        talep: talep || null,
        dilekce_md: dilekce_md.trim(),
        kaynaklar: kaynaklarToSave ?? null,
        girdi_ozeti: girdi_ozeti ?? null,
        dilekce_json: (dilekce_json ?? dilekce ?? null),
        dayanaklar:   dayArr.length ? dayArr : null,
      },
    });

    return NextResponse.json({ ...created, dayanaklar: dayArr });
  } catch (e) {
    console.error("POST /api/drafts error:", e);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }
}