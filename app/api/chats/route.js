// Proje yolunuz: /app/api/chats/route.js (veya pages/api/chats.js)

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

const API_ENDPOINT =
  process.env.API_ENDPOINT ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001/arama_yap";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(null, { status: 401 });
  }
  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { chats: true },
  });
  return new Response(
    JSON.stringify({ chats: user?.chats || [] }),
    { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
  );
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(null, { status: 401 });
  }
  const userId = session.user.id;
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const { chats } = body;
  await prisma.user.update({
    where: { id: userId },
    data: { chats },
  });
  return new Response(null, { status: 204 });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) { return new Response(null, { status: 401 }); }

  try {
    const body = await request.json();
    const apiRes = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!apiRes.ok) { return new Response(JSON.stringify({ error: "Arama servisi hatası." }), { status: 502 }); }

    let dataFromPython = await apiRes.json();

    if (Array.isArray(dataFromPython.ilgili_kararlar) && dataFromPython.ilgili_kararlar.length > 0) {
      // Weaviate sonuçlarını DB'deki Karar kayıtlarıyla eşleştirmek için filename türet:
      // 1) Eğer properties.dosya_adi '.txt' ile bitiyorsa onu kullan.
      // 2) Değilse properties.orijinal_karar_id + '.txt' kullan.
      const fileNames = Array.from(new Set(
        dataFromPython.ilgili_kararlar
          .map(k => k?.properties)
          .filter(Boolean)
          .map(p => {
            const dosyaAdi = p.dosya_adi;
            const baseId = p.orijinal_karar_id;
            if (typeof dosyaAdi === "string" && /\.txt$/i.test(dosyaAdi)) return dosyaAdi;
            if (typeof baseId === "string" && baseId.length > 0) return `${baseId}.txt`;
            return null;
          })
          .filter(Boolean)
      ));

      if (fileNames.length > 0) {
        const kararlarFromDb = await prisma.karar.findMany({
          where: { fileName: { in: fileNames } },
          select: { fileName: true, code: true, type: true },
        });

        const metaMap = new Map(
          kararlarFromDb.map(k => [k.fileName, { code: k.code, type: k.type }])
        );

        // Her bir sonucu, DB'den gelen type+code ile zenginleştir
        dataFromPython.ilgili_kararlar.forEach(item => {
          const p = item?.properties || {};
          const key =
            (typeof p.dosya_adi === "string" && /\.txt$/i.test(p.dosya_adi))
              ? p.dosya_adi
              : (typeof p.orijinal_karar_id === "string" && p.orijinal_karar_id.length > 0 ? `${p.orijinal_karar_id}.txt` : null);
          if (!key) return;
          const meta = metaMap.get(key);
          if (meta) {
            p.type = meta.type;
            p.code = meta.code;
            item.properties = p;
          }
        });
      }
    }

    return new Response(JSON.stringify(dataFromPython), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("API proxy veya DB eşleştirme hatası:", err);
    return new Response(JSON.stringify({ error: "İç sunucu hatası." }), { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  const userId = session.user.id;

  // id'yi önce query'den, yoksa gövdeden al
  const url = new URL(req.url);
  let id = url.searchParams.get("id");
  if (!id) {
    try {
      const body = await req.json();
      id = body?.id;
    } catch {
      // body yoksa görmezden gel
    }
  }

  if (!id || typeof id !== "string") {
    return new Response(JSON.stringify({ error: "Silmek için 'id' gereklidir." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Mevcut listeyi çek
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { chats: true },
  });

  const current = Array.isArray(user?.chats) ? user.chats : [];
  const exists = current.some((c) => c?.id === id);
  const updated = current.filter((c) => c?.id !== id);

  // Güncelle
  await prisma.user.update({
    where: { id: userId },
    data: { chats: updated },
  });

  // In-memory session güncellemesi (mümkünse)
  if (session && session.user) {
    // Eğer session.user.chats varsa güncelle
    if (Array.isArray(session.user.chats)) {
      session.user.chats = updated;
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message: exists ? "Analiz başarıyla silindi." : "Belirtilen analiz bulunamadı.",
      chats: updated
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}