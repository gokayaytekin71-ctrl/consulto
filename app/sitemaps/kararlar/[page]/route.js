import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const BASE_URL = "https://www.consultohukuk.com";
const PAGE_SIZE = 5000;

function xmlResponse(body) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function xmlEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

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
  const m = s.match(/(\d{4})[\/\-]([0-9A-Za-z\-()\/]+)\s*E.*?(\d{4})[\/\-]([0-9A-Za-z\-()\/]+)\s*K/i);

  if (!m) {
    return (
      s.replace(/[^0-9A-Za-z/_\-()]/g, "").replace(/\//g, "-") || "code"
    );
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

  const fn = (k?.fileName || "").replace(/\.txt$/i, "");
  return fn || `karar_${k?.id}`;
}

export async function GET(_req, { params }) {
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  let kararlar = [];

  try {
    kararlar = await prisma.karar.findMany({
      select: {
        id: true,
        fileName: true,
        type: true,
        code: true,
        createdAt: true,
      },
      orderBy: [
        { createdAt: "asc" },
        { id: "asc" },
      ],
      skip,
      take: PAGE_SIZE,
    });
  } catch (error) {
    console.error("Karar sitemap oluşturulamadı:", error);
    kararlar = [];
  }

  const urls = kararlar.map((k) => ({
    loc: `${BASE_URL}/kararlar/${buildKararIdFromRecord(k)}`,
    lastmod: (k.createdAt || new Date()).toISOString(),
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, lastmod }) =>
      `  <url><loc>${xmlEscape(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`
  )
  .join("\n")}
</urlset>`;

  return xmlResponse(xml);
}

export async function HEAD() {
  return new NextResponse(null, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}