// middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Sadece /kararlar/<slug> eşleşsin
  const m = pathname.match(/^\/kararlar\/([^/]+)$/);
  if (!m) return NextResponse.next();

  // Eski slug'ı normalize et
  const raw = decodeURIComponent(m[1]);
  if (raw.includes("__")) return NextResponse.next(); // yeni formatsa dokunma

  // " ... 12.14.30" gibi boşluktan sonrası çöpü at
  const clean = raw.replace(/\s+.*$/, "");

  // <MAHKEME>_<YYYY-...E_YYYY-...K> kalıbını yakala
  const match = clean.match(/^(.+?)_(\d{4}-[A-Za-z0-9()/.\-]+E_\d{4}-[A-Za-z0-9()/.\-]+K)$/);
  if (!match) return NextResponse.next();

  const courtPart = match[1].replace(/_/g, "-"); // "Hukuk-Genel-Kurulu" / "5-Hukuk-Dairesi"
  const codePart  = match[2];                    // "2017-765E_2019-216K"
  const destPath  = `/kararlar/${courtPart}__${codePart}`;

  if (pathname === destPath) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = destPath;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/kararlar/:slug*"],
};