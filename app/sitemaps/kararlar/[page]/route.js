// app/sitemaps/kararlar/[page]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // 👈 default import

const BASE_URL = "https://www.consultohukuk.com";
const PAGE_SIZE = 5000;

function xmlResponse(body) {
  return new NextResponse(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

function slugifyType(t = "") {
  const map = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };
  return String(t || "")
    .replace(/[·.]/g, " ")
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (m) => map[m] || m)
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase() || "mahkeme";
}
function codeToSegment(code = "") {
  const s = String(code || "").replace(/\s+/g, " ").trim();
  const m = s.match(/(\d{4})[\/\-]([0-9A-Za-z\-]+)\s*E.*?(\d{4})[\/\-]([0-9A-Za-z\-]+)\s*K/i);
  if (!m) return s.replace(/[^0-9A-Za-z\/-]/g, "").replace(/[\/]/g, "-") || "code";
  const eYear = m[1], eNo = m[2], kYear = m[3], kNo = m[4];
  return `${eYear}-${eNo}E_${kYear}-${kNo}K`;
}
function buildKararIdFromRecord(k) {
  const type = (k?.type || "").trim();
  const code = (k?.code || "").trim();
  if (type && code) return `${slugifyType(type)}__${codeToSegment(code)}`;
  const fn = (k?.fileName || "").replace(/\.txt$/i, "");
  return fn || `karar_${k?.id}`;
}

export async function GET(_req, { params }) {
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  let kararlar = [];
  try {
    kararlar = await prisma.karar.findMany({
      select: { id: true, fileName: true, type: true, code: true, updatedAt: true },
      orderBy: { id: "asc" },
      skip,
      take: PAGE_SIZE,
    });
  } catch (_) {
    // DB kapalıysa boş urlset döndürürüz (Google hata vermez)
    kararlar = [];
  }

  const urls = kararlar.map((k) => ({
    loc: `${BASE_URL}/kararlar/${buildKararIdFromRecord(k)}`,
    lastmod: (k.updatedAt || new Date()).toISOString(),
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, lastmod }) =>
      `  <url><loc>${loc}</loc><changefreq>monthly</changefreq><lastmod>${lastmod}</lastmod><priority>0.5</priority></url>`
  )
  .join("\n")}
</urlset>`;

  return xmlResponse(xml);
}

export async function HEAD() {
  return xmlResponse(null);
}