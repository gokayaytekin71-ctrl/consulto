import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = 'nodejs';
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type") || "";
  const codeParam = searchParams.get("code") || "";

  try {
    // 1. Daire adını normalize et: 
    // "Yargıtay 3. Hukuk Dairesi" -> "3. Hukuk Dairesi"
    const targetType = typeParam.replace(/Yargıtay\s+/i, "").trim();
    
    // 2. Code'u normalize et:
    // "2024/1255 E. 2025/813 K." gibi bir şeyi veritabanındaki 
    // formatla (2022/6372 E. 2023/2031 K.) karşılaştırmak için 
    // verileri çekerken temizleyelim.

    const kararlar = await prisma.karar.findMany({
      where: {
        // Tip (Mahkeme) eşleşmesi (Yargıtay kelimesini yok sayarak)
        type: { contains: targetType, mode: 'insensitive' }
      },
      select: { aiSummary: true, code: true }
    });

    // 3. Kod eşleşmesini RAM'de yapalım (Esas ve Karar numarası kısımlarını temizleyip)
    const normalizedCode = codeParam.replace(/\s+/g, '').replace(/\./g, '').toLowerCase();
    
    const karar = kararlar.find(k => {
      const dbCode = (k.code || "").replace(/\s+/g, '').replace(/\./g, '').toLowerCase();
      return dbCode === normalizedCode;
    });

    if (!karar) {
      return NextResponse.json({ 
        error: "Karar bulunamadı", 
        debug: { targetType, normalizedCode } 
      }, { status: 404 });
    }

    return NextResponse.json({ aiSummary: karar.aiSummary || "" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}