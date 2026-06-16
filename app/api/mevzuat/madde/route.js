// app/api/mevzuat/madde/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


/* ---------------- helpers ---------------- */

function slugifyTr(s = "") {
  const map = { "ı":"i","İ":"i","ş":"s","Ş":"s","ç":"c","Ç":"c","ö":"o","Ö":"o","ü":"u","Ü":"u","ğ":"g","Ğ":"g" };
  return (s || "")
    .replace(/[ıİşŞçÇöÖüÜğĞ]/g, c => map[c] || c)
    .toLowerCase();
}

// “7201 sayılı”, “4857 sayili”, “1475 numaralı”, “6100 no.lu” gibi önekleri kırp
function stripSayili(s = "") {
  return (s || "")
    .replace(/^\s*\d+(?:\s*\/\s*\d+)?\s*(?:say[ıi]l[ıi]|numaral[ıi]|no\.?lu?)\s+/i, "")
    .trim();
}

// Kanun adını normalize (TR/küçük harf, boşluk sadeleştirme)
function normalizeKanunName(s = "") {
  return slugifyTr(stripSayili(s))
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// HTML kırp (varsa)
function stripHtml(s = "") {
  return (s || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " </p>")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// “m. 62”, “Madde 62/1”, “Geçici 1” -> { no:"62", gecici:false }
function parseMadde(raw = "") {
  const txt = String(raw || "").trim();
  const gecici = /ge[cç]ici/i.test(txt);
  const no = txt.match(/\d+/)?.[0] || "";
  return { no, gecici };
}

/* ---------------- handler ---------------- */

export async function GET(req) {
  const startedAt = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const kanunRaw = (searchParams.get("kanun") || "").trim();
    const maddeRaw = (searchParams.get("madde") || "").trim();

    if (!kanunRaw || !maddeRaw) {
      return NextResponse.json({ ok: false, maddeMetin: "", reason: "bad_request" }, { status: 200 });
    }

    const { no: maddeNo, gecici } = parseMadde(maddeRaw);
    if (!maddeNo) {
      return NextResponse.json({ ok: false, maddeMetin: "", reason: "madde_parse_failed" }, { status: 200 });
    }

    const kanunClean = stripSayili(kanunRaw);
    const kanunNorm  = normalizeKanunName(kanunRaw);
    const slugGuess  = kanunNorm.replace(/\s+/g, "-"); // “turk-borclar-kanunu” vb.

    // 1) Önce Mevzuat’ı bul
    let mev = await prisma.mevzuat.findFirst({
      where: {
        OR: [
          { slug: { equals: slugGuess } },
          { name: { equals: kanunClean, mode: "insensitive" } },
          { name: { contains: kanunClean, mode: "insensitive" } },
          { shortName: { equals: kanunClean, mode: "insensitive" } },
          { shortName: { contains: kanunClean, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, slug: true, shortName: true }
    });

    // 1b) Geniş arama + JS-normalizasyon ile seç
    if (!mev) {
      const candidates = await prisma.mevzuat.findMany({
        where: {
          OR: [
            { name: { contains: stripSayili(kanunRaw), mode: "insensitive" } },
            { shortName: { contains: stripSayili(kanunRaw), mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, slug: true, shortName: true }
      });

      mev = candidates.find(c => {
        const n1 = normalizeKanunName(c.name || "");
        const n2 = normalizeKanunName(c.shortName || "");
        return (
          n1 === kanunNorm || n2 === kanunNorm ||
          n1.includes(kanunNorm) || kanunNorm.includes(n1) ||
          n2.includes(kanunNorm) || kanunNorm.includes(n2)
        );
      }) || null;
    }

    if (!mev) {
      return NextResponse.json({
        ok: false,
        maddeMetin: "",
        reason: "mevzuat_not_found",
        debug: { kanunIncoming: kanunRaw, kanunClean, kanunNorm, slugGuess, tookMs: Date.now() - startedAt }
      }, { status: 200 });
    }

    // 2) Bu kanuna ait maddeyi bul
    const nInt = parseInt(maddeNo, 10);
    let rec = await prisma.mevzuatMadde.findFirst({
      where: {
        mevzuatId: mev.id,
        OR: [
          { maddeNo: { equals: maddeNo } },
          { maddeNoOrder: Number.isFinite(nInt) ? nInt : undefined },
          { maddeNo: { equals: `Geçici ${maddeNo}`, mode: "insensitive" } },
          { maddeNo: { contains: ` ${maddeNo} `, mode: "insensitive" } },
        ].filter(Boolean)
      },
      select: {
        maddeMetin: true, maddeNo: true, maddeBaslik: true,
        maddeNoOrder: true,
      }
    });

    // 2b) Bulunamazsa biraz daha genişleterek ara (başlık vs.)
    if (!rec) {
      const list = await prisma.mevzuatMadde.findMany({
        where: { mevzuatId: mev.id },
        take: 50,
        select: { maddeMetin: true, maddeNo: true, maddeBaslik: true, maddeNoOrder: true }
      });

      // Önce tam eşleşme, sonra “Geçici”, sonra içerir
      rec =
        list.find(r => String(r.maddeNo) === maddeNo) ||
        (gecici ? list.find(r => /ge[cç]ici/i.test(r.maddeNo || r.maddeBaslik || "")) : null) ||
        list.find(r => new RegExp(`(^|\\s)${maddeNo}(\\s|/|\\.|,|$)`).test(`${r.maddeNo} ${r.maddeBaslik}`)) ||
        (Number.isFinite(nInt) ? list.find(r => r.maddeNoOrder === nInt) : null) ||
        null;
    }

    if (!rec) {
      return NextResponse.json({
        ok: false,
        maddeMetin: "",
        reason: "madde_not_found",
        debug: { mevzuatId: mev.id, mevzuatName: mev.name, maddeNo, tookMs: Date.now() - startedAt }
      }, { status: 200 });
    }

    return NextResponse.json({
      ok: true,
      maddeMetin: stripHtml(rec.maddeMetin || ""),
      meta: {
        mevzuatName: mev.name,
        mevzuatSlug: mev.slug,
        maddeNo: rec.maddeNo || maddeNo,
        tookMs: Date.now() - startedAt,
      }
    });
  } catch (e) {
    console.error("[/api/mevzuat/madde] error:", e);
    return NextResponse.json({ ok: false, maddeMetin: "", reason: "server_error" }, { status: 200 });
  }
}