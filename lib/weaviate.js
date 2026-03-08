// lib/weaviate.js

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://51.159.28.179:5002"; 

export async function semanticSearchWithSnippets(userQuery, topK = 35) {
  if (!userQuery || !userQuery.trim()) return [];

  try {
    console.log(`[Frontend] Python API'ye arama isteği gönderiliyor: "${userQuery}"`);
    
    // 1. Python sunucundaki /arama_yap endpoint'ine POST isteği at
    const response = await fetch(`${PYTHON_API_URL}/arama_yap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sorgu: userQuery })
    });

    if (!response.ok) {
      console.error(`[Frontend] Python API Hatası! Status: ${response.status}`);
      return [];
    }

    // 2. Python'dan gelen muazzam zengin JSON'u al
    const data = await response.json();
    const kararlar = data.ilgili_kararlar || [];

    console.log(`[Frontend] Python API'den ${kararlar.length} adet sonuç başarıyla alındı.`);

    // 3. Frontend arayüzünün (UI) beklediği standart "ClientItem" formatına çevir
    let clientItems = kararlar.map((r, index) => {
      const props = r.properties || {};
      
      // app.py zaten distance skorunu doğru hesaplıyor. Biz de gerçek yüzdeyi alıyoruz.
      const distance = r.distance ?? 1; 
      const absoluteScore = Math.max(0, 1 - distance);

      // Esas ve Karar numarasını toparla
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
        score: absoluteScore // Yapay UI skoru yok, doğrudan gerçek benzerlik puanı!
      };
    });

    // Skora göre (en yüksekten en düşüğe) sıralayıp frontend'e gönder
    clientItems.sort((a, b) => b.score - a.score);
    
    return clientItems.slice(0, topK);

  } catch (error) {
    console.error("[Frontend] Python sunucusuna bağlanırken kritik hata:", error);
    return [];
  }
}