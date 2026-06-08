// app/api/kararlar/summary/route.js
// Bağlam kararının AI özetini Karar tablosundan getirir.
// /kararlar/[id]/page.js ile BİREBİR aynı eşleştirme mantığı:
// code'u tam eşleştirmek yerine esas ve karar numaralarını ayrı ayrı `contains`
// ile ara; type filtresi tutmazsa code-only'ye düş.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // page.js ile aynı import (default export)

// "2024/1255 E. 2025/813 K." veya slug "..._2024-1255E_2025-813K" -> sayı parçaları
function parseCodeParts(code = "", slug = "") {
  let m = String(code).match(/(\d{4})\/([0-9A-Za-z\-()\/]+)\s*E.*?(\d{4})\/([0-9A-Za-z\-()\/]+)/i);
  if (m) return { eYear: m[1], eNo: m[2], kYear: m[3], kNo: m[4] };

  m = String(slug).match(/(\d{4})-([0-9A-Za-z\-()\/]+)E_(\d{4})-([0-9A-Za-z\-()\/]+)K/i);
  if (m) return { eYear: m[1], eNo: m[2], kYear: m[3], kNo: m[4] };

  return null;
}

// "Yargıtay 3. Hukuk Dairesi" / "3-hukuk-dairesi" -> "3 Hukuk Dairesi" (page.js tBase mantığı)
function buildTypeBase(typeRaw = "", slug = "") {
  let t = String(typeRaw || "").replace(/^\s*Yargıtay\s*/i, "");

  if (!t && slug && slug.includes("__")) {
    t = slug.split("__")[0]; // "3-hukuk-dairesi"
  }

  return t
    .replace(/-/g, " ")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request) {
  try {
    console.log("[kararlar/summary] V4 ROUTE ÇALIŞIYOR ->", request.url);
    const { searchParams } = new URL(request.url);
    const slug = (searchParams.get("slug") || "").trim();
    const code = (searchParams.get("code") || "").trim();
    const type = (searchParams.get("type") || "").trim();

    const parts = parseCodeParts(code, slug);
    if (!parts) {
      return NextResponse.json({ error: "Esas/Karar numarası çözümlenemedi." }, { status: 400 });
    }

    const { eYear, eNo, kYear, kNo } = parts;
    const codeFilters = [
      { code: { contains: `${eYear}/${eNo}` } },
      { code: { contains: `${kYear}/${kNo}` } },
    ];

    const select = { type: true, code: true, aiSummary: true, keywords: true };
    const tBase = buildTypeBase(type, slug);

    let karar = null;

    // 1) code + type (daire ile ayır) — page.js'teki birincil sorgu
    if (tBase) {
      karar = await prisma.karar.findFirst({
        where: { AND: [...codeFilters, { type: { contains: tBase, mode: "insensitive" } }] },
        select,
      });
    }

    // 2) fallback: yalnız code numaraları — page.js'teki yedek sorgu
    if (!karar) {
      karar = await prisma.karar.findFirst({
        where: { AND: codeFilters },
        select,
      });
    }

    if (!karar) {
      console.warn("[kararlar/summary] EŞLEŞME YOK", { slug, code, type, tBase, parts });
      return NextResponse.json({ error: "Karar bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({
      type: karar.type || "",
      code: karar.code || "",
      aiSummary: karar.aiSummary || "",
      keywords: karar.keywords || "",
    });
  } catch (error) {
    console.error("kararlar/summary hatası:", error);
    return NextResponse.json(
      { error: error?.message || "AI özeti alınamadı." },
      { status: 500 }
    );
  }
}