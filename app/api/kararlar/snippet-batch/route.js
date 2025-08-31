// app/api/kararlar/snippet-batch/route.js
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function makeSnippet(haystack, term, radius = 240) {
  if (!haystack || !term) return "";
  const low = haystack.toLowerCase();
  const idx = low.indexOf(term.toLowerCase());
  if (idx === -1) return haystack.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(haystack.length, idx + term.length + radius);
  return haystack.slice(start, end);
}

const FIELD_SELECT = {
  content:  { content: true },
  aiSummary:{ aiSummary: true },
  keywords: { keywords: true },
};

export async function POST(req) {
  try {
    const body  = await req.json();
    let ids     = Array.isArray(body?.ids) ? body.ids : [];
    const field = (body?.field === "aiSummary" || body?.field === "keywords") ? body.field : "content";
    const term  = typeof body?.term === "string" ? body.term : "";

    // normalize & cap ids
    const MAX_IDS = 50;
    ids = [...new Set(ids.map(String))].slice(0, MAX_IDS);
    if (!ids.length) {
      return NextResponse.json({ snippets: {} });
    }

    const rows = await prisma.karar.findMany({
      where: { id: { in: ids } },
      select: { id: true, ...FIELD_SELECT[field] },
    });

    const out = Object.create(null);
    for (const r of rows) {
      const text =
        field === "content"   ? (r.content   || "") :
        field === "aiSummary" ? (r.aiSummary || "") :
                                (r.keywords  || "");
      out[r.id] = term ? makeSnippet(text, term) : "";
    }

    // ensure all requested ids are present in response
    for (const id of ids) {
      if (!(id in out)) out[id] = "";
    }

    return NextResponse.json({ snippets: out });
  } catch (e) {
    console.error("snippet-batch error:", e);
    return NextResponse.json({ snippets: {} }, { status: 200 });
  }
}