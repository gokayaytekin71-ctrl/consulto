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
    
    // DÜZELTME 1: Python API "kararlar" anahtarıyla (key) dönüyor.
    const kararlar = data.kararlar || [];

    console.log(`[Frontend] Python API'den ${kararlar.length} adet sonuç başarıyla alındı.`);

    let clientItems = kararlar.map((r, index) => {
      const props = r.properties || {};
      
      const distance = r.distance ?? 1; 
      // Distance 1 ise eşleşme yok (0 puan), 0 ise tam eşleşme (1 puan) demektir
      // Math.max ve Math.min ile skoru 0-1 arasına hapsediyoruz ki saçmalamasın
      const absoluteScore = Math.min(Math.max(0, 1 - distance), 1);

      let codeStr = "";
      if (props.esas_no && props.karar_no) {
        codeStr = `${props.esas_no} E. ${props.karar_no} K.`;
      } else if (props.code) {
        codeStr = props.code;
      }

      return {
        id: props.benzersiz_id_str || props.orijinal_karar_id || `k_py_${index}`,
        typeLabel: props.mahkeme || props.type || "Yargıtay Kararı",
        code: codeStr,
        snippet: props.metin_parcasi || "",
        score: absoluteScore,
        // DÜZELTME 2: route.js'nin veritabanında "type" ve "code" bulabilmesi için
        // dosya_adi parametresini fileName olarak dışarı aktarmamız gerekiyor.
        fileName: props.dosya_adi ? props.dosya_adi.replace(".txt", "") : null 
      };
    });

    clientItems.sort((a, b) => b.score - a.score);
    
    return clientItems.slice(0, topK);

  } catch (error) {
    console.error("[Frontend] Python sunucusuna bağlanırken kritik hata:", error);
    return [];
  }
}