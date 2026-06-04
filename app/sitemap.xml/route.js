import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // 👈 default import

const BASE_URL = "https://www.consultohukuk.com";
const PAGE_SIZE = 5000;

function xmlResponse(body) {
  return new NextResponse(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

export async function GET() {
  // DB erişimi hata verirse index yine çalışsın
  let pageCount = 1;
  try {
    const total = await prisma.karar.count();
    pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  } catch (_) {
    // noop: boş index de Google için geçerlidir, alt haritalar sonra eklenebilir
  }

  // lastmod değişkenini buradan tamamen sildik

  const items = [
    `${BASE_URL}/sitemaps/static`,
    `${BASE_URL}/sitemaps/araclar`,
    `${BASE_URL}/sitemaps/blog`,
    ...Array.from({ length: pageCount }, (_, i) => `${BASE_URL}/sitemaps/kararlar/${i + 1}`),
  ];

  // Aşağıdaki XML çıktısının içinden <lastmod> etiketlerini sildik
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.map((url) => `  <sitemap><loc>${url}</loc></sitemap>`).join("\n")}
</sitemapindex>`;

  return xmlResponse(xml);
}

export async function HEAD() {
  return xmlResponse(null);
}