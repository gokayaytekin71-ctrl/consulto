// app/api/semantic-search/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { semanticSearchWithSnippets } from "@/lib/weaviate";

// --- HELPER FUNCTIONS ---
// Karar detay sayfasındaki mantıkla birebir uyumlu olmalı.

function slugifyType(t = "") {
  const map = {
    ç: "c",
    Ç: "C",
    ğ: "g",
    Ğ: "G",
    ı: "i",
    İ: "I",
    ö: "o",
    Ö: "O",
    ş: "s",
    Ş: "S",
    ü: "u",
    Ü: "U",
  };

  return String(t || "")
    .replace(/[·.]/g, " ")
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (m) => map[m] || m)
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || "Mahkeme";
}

function codeToSegment(code = "") {
  const s = String(code || "").replace(/\s+/g, " ").trim();
  const m = s.match(
    /(\d{4})[\/\-]([0-9A-Za-z\-()\/]+)\s*E.*?(\d{4})[\/\-]([0-9A-Za-z\-()\/]+)\s*K/i
  );

  if (!m) {
    return s.replace(/[^0-9A-Za-z/_\-()]/g, "").replace(/\//g, "-") || "code";
  }

  const eYear = m[1];
  const eNo = m[2].replace(/\//g, "-");
  const kYear = m[3];
  const kNo = m[4].replace(/\//g, "-");

  return `${eYear}-${eNo}E_${kYear}-${kNo}K`;
}

function buildKararIdFromRecord(k) {
  const type = (k?.type || "").trim();
  const code = (k?.code || "").trim();

  if (type && code) {
    return `${slugifyType(type)}__${codeToSegment(code)}`;
  }

  return (k?.fileName || "").replace(/\.txt$/i, "") || "";
}

function normalizeFileName(value) {
  return String(value || "").trim();
}

function normalizeType(value) {
  return String(value || "").trim();
}

function normalizeCode(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json([]);
  }

  try {
    const raw = await semanticSearchWithSnippets(q, 60);

    if (!raw.length) {
      return NextResponse.json([]);
    }

    // 1) Prisma için arama listeleri
    const fileNames = [
      ...new Set(
        raw
          .map((r) => normalizeFileName(r.fileName))
          .filter(Boolean)
      ),
    ];

    const rawPairs = raw
      .map((r) => ({
        type: normalizeType(r.type),
        code: normalizeCode(r.code),
      }))
      .filter((x) => x.type && x.code);

    // duplicate pair temizliği
    const seenPairs = new Set();
    const typeCodePairs = rawPairs.filter((x) => {
      const key = `${x.type}|${x.code}`;
      if (seenPairs.has(key)) return false;
      seenPairs.add(key);
      return true;
    });

    // 2) Prisma lookup
    const orConditions = [];
    if (fileNames.length) {
      orConditions.push({ fileName: { in: fileNames } });
    }
    if (typeCodePairs.length) {
      orConditions.push({ OR: typeCodePairs });
    }

    const dbRows = orConditions.length
      ? await prisma.karar.findMany({
          where: { OR: orConditions },
          select: {
            type: true,
            code: true,
            fileName: true,
            aiSummary: true,
            keywords: true,
          },
        })
      : [];

    // 3) Map'ler
    const nameMap = new Map(
      dbRows
        .filter((r) => r.fileName)
        .map((r) => [normalizeFileName(r.fileName), r])
    );

    const pairMap = new Map(
      dbRows.map((r) => [
        `${normalizeType(r.type)}|${normalizeCode(r.code)}`,
        r,
      ])
    );

    // 4) Enrich
    const enriched = raw.map((r) => {
      const normalizedFileName = normalizeFileName(r.fileName);
      const normalizedType = normalizeType(r.type);
      const normalizedCode = normalizeCode(r.code);

      const pairKey = `${normalizedType}|${normalizedCode}`;
      const dbMatch =
        nameMap.get(normalizedFileName) ||
        pairMap.get(pairKey) ||
        null;

      const mergedRecord = {
        fileName: dbMatch?.fileName || normalizedFileName || null,
        type: dbMatch?.type || normalizedType || "",
        code: dbMatch?.code || normalizedCode || "",
      };

      return {
        ...r,
        typeLabel: mergedRecord.type || "Yargıtay Kararı",
        code: mergedRecord.code || "Karar No Belirtilmemiş",
        aiSummary: dbMatch?.aiSummary || null,
        keywords: dbMatch?.keywords || null,
        slug: buildKararIdFromRecord(mergedRecord),
      };
    });

    return NextResponse.json(enriched);
  } catch (e) {
    console.error("API Hatası:", e);
    return NextResponse.json(
      { error: "Arama başarısız." },
      { status: 500 }
    );
  }
}