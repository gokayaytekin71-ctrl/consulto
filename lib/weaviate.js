// lib/weaviate.js
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://51.159.28.179:5002"; 

export async function semanticSearchWithSnippets(userQuery, topK = 35) {
  if (!userQuery || !userQuery.trim()) return [];

  try {
    const response = await fetch(`${PYTHON_API_URL}/arama_yap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sorgu: userQuery })
    });

    if (!response.ok) return [];

    const data = await response.json();
    const kararlar = data.kararlar || [];

    return kararlar.map((r, index) => {
      const p = r.properties || {};
      
      // Karar numarasını oluştur (Görüntü 3'teki formata sadık kalarak)
      let codeStr = (p.esas_no && p.karar_no) 
        ? `${p.esas_no} E. ${p.karar_no} K.` 
        : (p.code || "");

      return {
        id: p.benzersiz_id_str || p.orijinal_karar_id || `k_${index}`,
        score: r.score || 0,
        snippet: p.metin_parcasi || "",
        // Prisma lookup için kritik alanlar (Trim ekledik!)
        type: (p.mahkeme || "").trim(), 
        code: codeStr.trim(),
        // Yedek olarak fileName (DB'de uzantı varsa diye kontrol ekliyoruz)
        fileName: p.dosya_adi ? p.dosya_adi.trim() : null
      };
    });
  } catch (error) {
    console.error("[weaviate.js] Hata:", error);
    return [];
  }
}