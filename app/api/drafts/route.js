import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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

/** DB’de ‘dayanaklar’ kolonu olan tabloyu (schema+ad) bul */
async function findTableWithDayanaklar() {
  try {
    const rows = await prisma.$queryRawUnsafe(`
      select table_schema, table_name
      from information_schema.columns
      where lower(column_name) = 'dayanaklar'
      order by case when table_schema = current_schema() then 0 else 1 end
      limit 1
    `);
    if (Array.isArray(rows) && rows.length) {
      const r = rows[0];
      return { schema: r.table_schema, table: r.table_name };
    }
  } catch {}
  return null;
}

/** Ham UPDATE ile dayanaklar kolonunu set et */
async function setDayanaklarColumn({ schema, table, id, dayanaklar }) {
  try {
    // jsonb için parametreli kullanım (unsafe ama tablo adı dinamik olduğu için gerekli)
    await prisma.$executeRawUnsafe(
      `update "${schema}"."${table}" set "dayanaklar" = $1::jsonb where "id" = $2`,
      JSON.stringify(dayanaklar),
      id
    );
    return true;
  } catch (e) {
    // kolon yoksa veya tablo adı farklıysa sessizce düş
    return false;
  }
}

/** Verilen id listesi için ham SELECT ile dayanakları getir (varsa) */
async function fetchDayanaklarForIds({ schema, table, ids = [] }) {
  if (!ids.length) return new Map();
  try {
    const rows = await prisma.$queryRawUnsafe(
      `select "id", "dayanaklar" from "${schema}"."${table}" where "id" = any($1)`,
      ids
    );
    const map = new Map();
    for (const r of rows || []) {
      map.set(r.id, Array.isArray(r.dayanaklar) ? r.dayanaklar : (r.dayanaklar ?? []));
    }
    return map;
  } catch {
    return new Map();
  }
}

// ---------- GET ----------
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || 6);

    const items = await prisma.draft.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // DB’de dayanaklar kolonu olan gerçek tabloyu bul
    const tbl = await findTableWithDayanaklar();

    let dayMap = new Map();
    if (tbl) {
      dayMap = await fetchDayanaklarForIds({
        schema: tbl.schema,
        table: tbl.table,
        ids: items.map((x) => x.id),
      });
    }

    // Her kayda dayanaklar ekle (öncelik: gerçek kolon → kaynaklar.dayanaklar → dilekce_json.dayanaklar)
    const withDayanak = items.map((d) => {
      let day = dayMap.get(d.id);
      if (!Array.isArray(day) || !day.length) {
        if (d?.kaynaklar && Array.isArray(d.kaynaklar.dayanaklar)) {
          day = d.kaynaklar.dayanaklar;
        } else if (d?.dilekce_json && Array.isArray(d.dilekce_json.dayanaklar)) {
          day = d.dilekce_json.dayanaklar;
        } else if (Array.isArray(d?.dayanaklar)) {
          day = d.dayanaklar;
        } else {
          day = [];
        }
      }
      return { ...d, dayanaklar: day };
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

    // DB’de ‘dayanaklar’ kolonu olan tabloyu bul ve ham UPDATE ile yaz
    if (dayArr.length) {
      const tbl = await findTableWithDayanaklar();
      if (tbl) {
        await setDayanaklarColumn({
          schema: tbl.schema,
          table: tbl.table,
          id: created.id,
          dayanaklar: dayArr,
        });
      }
    }

    return NextResponse.json({ ...created, dayanaklar: dayArr });
  } catch (e) {
    console.error("POST /api/drafts error:", e);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }
}