// app/sitemaps/kararlar/[page]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://www.consultohukuk.com";
const PAGE_SIZE = 5000;

function xmlResponse(body) {
  return new NextResponse(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

export async function GET(_req, { params }) {
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const kararlar = await prisma.karar.findMany({
    select: { id: true, slug: true, updatedAt: true },
    orderBy: { id: "asc" },
    skip,
    take: PAGE_SIZE,
  });

  const urls = kararlar.map((k) => ({
    loc: `${BASE_URL}/kararlar/${k.slug || `karar_${k.id}`}`,
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