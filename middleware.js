// middleware.js
import { NextResponse } from "next/server";

// Bakım modu ENV ile kontrol edilir
const MAINTENANCE_MODE =
  process.env.NEXT_PUBLIC_MAINTENANCE === "true";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  /* ─────────────────────────────────────────────
     1️⃣ BAKIM MODU — TÜM SAYFALAR
     ───────────────────────────────────────────── */
  if (MAINTENANCE_MODE) {
    // izin verilen yollar (loop önleme)
    if (
      pathname === "/maintenance" ||
      pathname.startsWith("/_next") ||
      pathname === "/favicon.ico" ||
      pathname.startsWith("/api")
    ) {
      return NextResponse.next();
    }

    // her şeyi /maintenance'a yönlendir
    const url = req.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.redirect(url, 307);
  }

  /* ─────────────────────────────────────────────
     2️⃣ MEVCUT KARAR SLUG NORMALIZATION (DEĞİŞMEDİ)
     ───────────────────────────────────────────── */

  // Sadece /kararlar/<slug> eşleşsin
  const m = pathname.match(/^\/kararlar\/([^/]+)$/);
  if (!m) return NextResponse.next();

  const raw = decodeURIComponent(m[1]);
  if (raw.includes("__")) return NextResponse.next(); // yeni format

  const clean = raw.replace(/\s+.*$/, "");

  const match = clean.match(
    /^(.+?)_(\d{4}-[A-Za-z0-9()/.\-]+E_\d{4}-[A-Za-z0-9()/.\-]+K)$/
  );
  if (!match) return NextResponse.next();

  const courtPart = match[1].replace(/_/g, "-");
  const codePart = match[2];
  const destPath = `/kararlar/${courtPart}__${codePart}`;

  if (pathname === destPath) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = destPath;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: [
    // API ve Next.js internal HARİÇ, geri kalan HER ŞEY
    "/((?!api|_next|favicon.ico).*)",
  ],
};