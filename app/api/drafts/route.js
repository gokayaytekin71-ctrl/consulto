import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


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

function normalizeNullableString(v) {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

function normalizeJsonValue(v) {
  if (v == null) return null;
  if (
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean" ||
    Array.isArray(v) ||
    (typeof v === "object" && v.constructor === Object)
  ) {
    return v;
  }
  return null;
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

    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED_DRAFTS",
          message: "Oturum bilgisi eksik. Lütfen yeniden giriş yapın.",
          requireLogin: true,
          type: "drafts",
        },
        { status: 401 }
      );
    }

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

    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED_DRAFTS",
          message: "Oturum bilgisi eksik. Lütfen yeniden giriş yapın.",
          requireLogin: true,
          type: "drafts",
        },
        { status: 401 }
      );
    }

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

    const kaynaklarToSave = normalizeJsonValue(mergeKaynaklarAndDayanaklar(normalizeJsonValue(kaynaklar), dayArr));

    // ŞEMADA OLAN alanlarla kaydı oluştur
    const created = await prisma.draft.create({
      data: {
        userId,
        dava_turu: normalizeNullableString(dava_turu),
        olay_ozet: normalizeNullableString(olay_ozet),
        talep: normalizeNullableString(talep),
        dilekce_md: dilekce_md.trim(),
        kaynaklar: kaynaklarToSave,
        girdi_ozeti: normalizeNullableString(girdi_ozeti),
        dilekce_json: normalizeJsonValue(dilekce_json ?? dilekce ?? null),
        dayanaklar: dayArr.length ? dayArr : null,
      },
    });

    return NextResponse.json({ ...created, dayanaklar: dayArr });
  } catch (e) {
    console.error("POST /api/drafts error:", e);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }
}