// app/sitemaps/blog/route.js
import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/blog";

const BASE_URL = "https://consultohukuk.com";

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

export async function GET() {
  let posts = [];
  try {
    posts = getAllPosts();
  } catch (error) {
    console.error("Blog sitemap oluşturulamadı:", error);
    posts = [];
  }

  const now = new Date().toISOString();

  // Blog ana liste sayfası + her yazı
  const urls = [
    { loc: `${BASE_URL}/blog`, lastmod: now, changefreq: "daily", priority: "0.8" },
    ...posts.map((p) => ({
      loc: `${BASE_URL}/blog/${p.slug}`,
      lastmod: new Date(p.updated || p.date || now).toISOString(),
      changefreq: "monthly",
      priority: "0.7",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, lastmod, changefreq, priority }) =>
      `  <url><loc>${xmlEscape(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
  )
  .join("\n")}
</urlset>`;

  return xmlResponse(xml);
}

export async function HEAD() {
  return xmlResponse(null);
}
