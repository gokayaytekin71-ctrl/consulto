import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Güvenli sütun adı seçimi (SQL injection'a izin verme)
const FIELD_COLUMN = {
  content: Prisma.sql`"content"`,
  aiSummary: Prisma.sql`"aiSummary"`,
  keywords: Prisma.sql`"keywords"`,
};

// ts_headline seçenekleri: <mark> ile sar, fragman sayısı/sözcük aralığı ayarla
const HL_OPTS =
  "StartSel=<mark>,StopSel=</mark>,MaxFragments=3,MinWords=10,MaxWords=35,ShortWord=2,FragmentDelimiter=…";

/**
 * `GET /api/kararlar/snippet?id=...&field=content|aiSummary|keywords&term=...`
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const field = searchParams.get("field"); // "content" | "aiSummary" | "keywords"
  const term = (searchParams.get("term") || "").trim();

  if (!id || !field || !(field in FIELD_COLUMN)) {
    return NextResponse.json({ error: "Parametre eksik/hatalı" }, { status: 400 });
  }

  // Boş terimde, baştan kısa bir kesit döndür (DB'ye gitmeden)
  if (!term) {
    try {
      const rec = await prisma.karar.findUnique({
        where: { id: String(id) },
        select:
          field === "content"
            ? { content: true }
            : field === "aiSummary"
            ? { aiSummary: true }
            : { keywords: true },
      });
      const text =
        field === "content"
          ? rec?.content || ""
          : field === "aiSummary"
          ? rec?.aiSummary || ""
          : rec?.keywords || "";
      return NextResponse.json({ snippet: text.slice(0, 280) });
    } catch (e) {
      console.error("Snippet route (empty term) error:", e);
      return NextResponse.json({ snippet: "" });
    }
  }

  // 1) Önce websearch_to_tsquery ile dene (AND/OR, tırnaklı arama vb. destekler)
  const column = FIELD_COLUMN[field];
  const q1 = Prisma.sql`
    SELECT ts_headline('turkish', ${column},
      websearch_to_tsquery('turkish', ${term}),
      ${HL_OPTS}
    ) AS snippet
    FROM "Karar"
    WHERE "id" = ${id}
    LIMIT 1
  `;

  try {
    const rows = await prisma.$queryRaw(q1);
    const snippet = Array.isArray(rows) && rows[0]?.snippet;
    if (snippet && typeof snippet === "string" && snippet.trim()) {
      return NextResponse.json({ snippet });
    }
  } catch (e) {
    // websearch_to_tsquery ifadesi bozuk olabilir; aşağıda plainto_tsquery ile tekrar deniyoruz
    console.warn("websearch_to_tsquery fallback -> plainto_tsquery. term:", term, e?.message);
  }

  // 2) Fallback: plainto_tsquery (daha toleranslı)
  const q2 = Prisma.sql`
    SELECT ts_headline('turkish', ${column},
      plainto_tsquery('turkish', ${term}),
      ${HL_OPTS}
    ) AS snippet
    FROM "Karar"
    WHERE "id" = ${id}
    LIMIT 1
  `;

  try {
    const rows2 = await prisma.$queryRaw(q2);
    let snippet = Array.isArray(rows2) ? rows2[0]?.snippet : "";

    // Hâlâ boşsa: baştan kısa kesit
    if (!snippet || !String(snippet).trim()) {
      const rec = await prisma.karar.findUnique({
        where: { id: String(id) },
        select:
          field === "content"
            ? { content: true }
            : field === "aiSummary"
            ? { aiSummary: true }
            : { keywords: true },
      });
      const text =
        field === "content"
          ? rec?.content || ""
          : field === "aiSummary"
          ? rec?.aiSummary || ""
          : rec?.keywords || "";
      snippet = text.slice(0, 280);
    }

    return NextResponse.json({ snippet });
  } catch (e) {
    console.error("Snippet route (plainto) error:", e);
    return NextResponse.json({ snippet: "" });
  }
}