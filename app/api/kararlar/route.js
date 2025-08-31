import { NextResponse } from "next/server";
import { getKararlarFromDB } from "@/lib/data";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const cursor = searchParams.get("cursor") || undefined;

  const q         = searchParams.get("q")         || undefined;
  const mahkeme   = searchParams.get("mahkeme")   || undefined;
  const organ     = searchParams.get("organ")     || undefined;
  const kw        = searchParams.get("kw")        || undefined;
  const aiq       = searchParams.get("aiq")       || undefined;
  const esasYili  = searchParams.get("esasYili")  || undefined;
  const esasNo    = searchParams.get("esasNo")    || undefined;
  const kararYili = searchParams.get("kararYili") || undefined;
  const kararNo   = searchParams.get("kararNo")   || undefined;
  const sort      = searchParams.get("sort")      || undefined;
  const phrase    = searchParams.get("phrase") || undefined; // tam ifade (content)
  const qnot      = searchParams.get("qnot")   || undefined; // içerikten hariç tut

  try {
    const { data, nextCursor } = await getKararlarFromDB(
      { q, mahkeme, organ, kw, aiq, esasYili, esasNo, kararYili, kararNo, sort, phrase, qnot },
      cursor
    );
    return NextResponse.json({ data, nextCursor });
  } catch (error) {
    console.error("API Hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}