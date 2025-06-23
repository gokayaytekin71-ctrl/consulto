// Proje yolunuz: /app/api/chats/route.js (veya pages/api/chats.js)

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

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
    { status: 200, headers: { "Content-Type": "application/json" } }
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

    if (dataFromPython.ilgili_kararlar && dataFromPython.ilgili_kararlar.length > 0) {
      const fileNames = dataFromPython.ilgili_kararlar.map(k => k.properties.orijinal_karar_id);

      const kararlarFromDb = await prisma.karar.findMany({
          where: { fileName: { in: fileNames } },
          select: {
              fileName: true,
              code: true 
          }
      });

      const codeMap = new Map(kararlarFromDb.map(k => [k.fileName, k.code]));

      dataFromPython.ilgili_kararlar.forEach(karar => {
          const fileName = karar.properties.orijinal_karar_id;
          const code = codeMap.get(fileName);
          if (code) {
              karar.properties.code = code;
          }
      });
    }
    
    return new Response(JSON.stringify(dataFromPython), {
      status: 200, headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("API proxy veya DB eşleştirme hatası:", err);
    return new Response(JSON.stringify({ error: "İç sunucu hatası." }), { status: 500 });
  }
}