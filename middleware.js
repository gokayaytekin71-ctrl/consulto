// middleware.js
import { NextResponse } from "next/server";

// 👉 ENV ile kontrol (önerilen)
const MAINTENANCE_MODE =
  process.env.NEXT_PUBLIC_MAINTENANCE === "true";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  /* ─────────────────────────────────────────────
     1️⃣ BAKIM MODU (EN ÜSTE)
     ───────────────────────────────────────────── */
  if (MAINTENANCE_MODE) {
    // bakım sayfası + next static + favicon serbest
    if (
      pathname.startsWith("/maintenance") ||
      pathname.startsWith("/_next") ||
      pathname === "/favicon.ico"
    ) {
      return NextResponse.next();
    }

    // API'leri de istersen açık bırakabilirsin
    if (pathname.startsWith("/api")) {
      return NextResponse.next();
    }

    const url = req.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.redirect(url, 307);
  }

  /* ─────────────────────────────────────────────
     2️⃣ MEVCUT KARAR SLUG NORMALIZATION (AYNEN)
     ───────────────────────────────────────────── */

  // Sadece /kararlar/<slug> eşleşsin
  const m = pathname.match(/^\/kararlar\/([^/]+)$/);
  if (!m) return NextResponse.next();

  // Eski slug'ı normalize et
  const raw = decodeURIComponent(m[1]);
  if (raw.includes("__")) return NextResponse.next(); // yeni formatsa dokunma

  // " ... 12.14.30" gibi boşluktan sonrası çöpü at
  const clean = raw.replace(/\s+.*$/, "");

  // <MAHKEME>_<YYYY-...E_YYYY-...K> kalıbını yakala
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
  matcher: ["/((?!_next/static|_next/image).*)"],
};