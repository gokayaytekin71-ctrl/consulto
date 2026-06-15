// app/api/kararlar/search/route.js
// SearchResults.jsx -> handleLoadMore bu endpoint'i çağırır ve { data, nextCursor } bekler.
// NOT: Mevcut app/api/kararlar/route.js (type+code -> aiSummary) ile çakışmamak için
// arama AYRI yola (/api/kararlar/search) taşındı.
import { NextResponse } from "next/server";
import { getKararlarFromDB } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const get = (k) => searchParams.get(k) || undefined;

    const filters = {
      q:         get("q"),
      phrase:    get("phrase"),
      qnot:      get("qnot"),
      mahkeme:   get("mahkeme"),
      organ:     get("organ"),
      esasYili:  get("esasYili"),
      esasNo:    get("esasNo"),
      kararYili: get("kararYili"),
      kararNo:   get("kararNo"),
      kw:        get("kw"),
      aiq:       get("aiq"),
      sort:      get("sort"),
    };

    const cursor = get("cursor");

    const { data, nextCursor } = await getKararlarFromDB(filters, cursor);
    return NextResponse.json({ data, nextCursor: nextCursor ?? null });
  } catch (error) {
    console.error("[/api/kararlar/search] hata:", error);
    return NextResponse.json(
      { error: error?.message || "Sonuçlar alınamadı.", data: [], nextCursor: null },
      { status: 500 }
    );
  }
}