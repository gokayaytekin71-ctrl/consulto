// app/sitemaps/araclar/route.js
import { NextResponse } from "next/server";

const BASE_URL = "https://consultohukuk.com";

// Doğrulanmış araç sayfaları
const TOOLS = [
  "/araclar/arac-deger-kaybi",
  "/araclar/yaralanmali-trafik-kazasi",
  "/araclar/destekten-yoksun-kalma",
  "/araclar/kidem-tazminati",
  "/araclar/infaz-hesaplama",
  "/araclar/islah-harci-hesaplama",
  "/araclar/vekalet-ucreti-hesaplama",
  "/araclar/faiz-hesaplama",
];

function xmlResponse(body) {
  return new NextResponse(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

export async function GET() {
  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${TOOLS.map(
  (path) =>
    `  <url><loc>${BASE_URL}${path}</loc><changefreq>monthly</changefreq><lastmod>${now}</lastmod><priority>0.6</priority></url>`
).join("\n")}
</urlset>`;
  return xmlResponse(xml);
}

export async function HEAD() {
  return xmlResponse(null);
}
