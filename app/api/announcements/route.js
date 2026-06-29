import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ANNOUNCEMENTS } from "@/lib/announcements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const token = await getToken({ req: request });
  const userId = token?.id || null;

  if (!userId) {
    return NextResponse.json({ error: "Yetki yok" }, { status: 401 });
  }

  const activeAnnouncements = ANNOUNCEMENTS
    .filter(item => item.audience === "authenticated")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return NextResponse.json(activeAnnouncements);
}
