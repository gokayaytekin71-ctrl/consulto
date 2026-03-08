// lib/weaviate.js

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://51.159.28.179:5002"; 

export async function semanticSearchWithSnippets(userQuery, topK = 35) {
  if (!userQuery || !userQuery.trim()) return [];

  try {
    console.log(`[Frontend] Python API'ye arama isteği gönderiliyor: "${userQuery}"`);
    
    const response = await fetch(`${PYTHON_API_URL}/arama_yap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sorgu: userQuery })
    });

    if (!response.ok) {
      console.error(`[Frontend] Python API Hatası! Status: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const kararlar = data.kararlar || [];

    console.log(`[Frontend] Python API'den ${kararlar.length} adet sonuç başarıyla alındı.`);

    let clientItems = kararlar.map((r, index) => {
      const props = r.properties || {};
      
      // DÜZELTME: Python API zaten (1 - distance) işlemini yapıp "score" olarak yolluyor.
      // Eğer Python'da score gelmiyorsa fallback olarak 0.1 veriyoruz.
      const absoluteScore = r.score !== undefined ? r.score : 0.1;

      let codeStr = "";
      if (props.esas_no && props.karar_no) {
        codeStr = `${props.esas_no} E. {props.karar_no} K.`;
      } else if (props.code) {
        codeStr = props.code;
      }

      return {
        id: props.benzersiz_id_str || props.orijinal_karar_id || `k_py_${index}`,
        typeLabel: props.mahkeme || props.type || "Yargıtay Kararı",
        code: codeStr,
        snippet: props.metin_parcasi || "",
        score: absoluteScore, // Artık %0 görünmeyecek
        // DÜZELTME: Prisma'nın (route.js) doğru dosyayı bulabilmesi için
        fileName: props.dosya_adi || props.orijinal_karar_id || null
      };
    });

    // Skora göre sırala
    clientItems.sort((a, b) => b.score - a.score);
    
    return clientItems.slice(0, topK);

  } catch (error) {
    console.error("[Frontend] Python sunucusuna bağlanırken kritik hata:", error);
    return [];
  }
}