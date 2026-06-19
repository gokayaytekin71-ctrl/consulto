// app/sitemaps/static/route.js
import { NextResponse } from "next/server";

const BASE_URL = "https://consultohukuk.com";

const STATIC_URLS = [
  "/",                 // Ana sayfa
  "/akilli-arama",     // Akıllı Arama
  "/dilekce",          // Dilekçe Pro
  "/bot",              // Analiz Pro
  "/araclar",          // Araçlar landing
  "/hakkimizda",       // Hakkımızda
  "/iletisim",         // İletişim
  "/aydinlatma-metni", // KVKK Aydınlatma
  "/kvkk-politikasi",  // KVKK Politikası
  "/paketler-ucretler" // Paketler & Ücretler
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
${STATIC_URLS.map(
  (path) => `  <url><loc>${BASE_URL}${path}</loc><changefreq>weekly</changefreq><lastmod>${now}</lastmod><priority>0.8</priority></url>`
).join("\n")}
</urlset>`;
  return xmlResponse(xml);
}

export async function HEAD() {
  return xmlResponse(null);
}
