// lib/weaviate.js

// Python API adresin (Docker dışı/Systemd kullanımı için 5002 portu)
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://51.159.28.179:5002"; 

/**
 * Kullanıcı sorgusunu Python API üzerinden LLM ile zenginleştirip 
 * Weaviate'te arama yapan ana fonksiyondur.
 */
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
    
    // Python API "kararlar" anahtarıyla (key) döndüğü için doğrudan onu alıyoruz
    const kararlar = data.kararlar || [];

    console.log(`[Frontend] Python API'den ${kararlar.length} adet sonuç başarıyla alındı.`);

    let clientItems = kararlar.map((r, index) => {
      const props = r.properties || {};
      
      /** * 1. SKOR DÜZELTMESİ: 
       * Python API zaten (1 - distance) işlemini yapıp "score" olarak yolluyor.
       * r.distance aramak yerine doğrudan r.score kullanıyoruz.
       */
      const absoluteScore = r.score !== undefined ? r.score : 0;

      // Karar kodunu (Esas/Karar No) oluştur
      let codeStr = "";
      if (props.esas_no && props.karar_no) {
        codeStr = `${props.esas_no} E. ${props.karar_no} K.`;
      } else if (props.code) {
        codeStr = props.code;
      }

      return {
        id: props.benzersiz_id_str || props.orijinal_karar_id || `k_py_${index}`,
        
        /** * 2. DAİRE/MAHKEME BİLGİSİ:
         * Prisma'nın (route.js) veritabanında doğru kaydı bulabilmesi için fileName 
         * sütunu ile tam eşleşme (uzantı dahil) sağlanmalıdır.
         */
        fileName: props.dosya_adi 
          ? (props.dosya_adi.endsWith('.txt') ? props.dosya_adi : `${props.dosya_adi}.txt`) 
          : (props.orijinal_karar_id ? `${props.orijinal_karar_id}.txt` : null),

        // UI bileşenlerinin beklediği standart alanlar
        typeLabel: props.mahkeme || "Yargıtay Kararı",
        type: props.mahkeme || "Yargıtay Kararı",
        code: codeStr,
        snippet: props.metin_parcasi || "",
        score: absoluteScore // %0 hatasını çözen gerçek skor
      };
    });

    // Sonuçları en yüksek skordan başlayarak sırala
    clientItems.sort((a, b) => b.score - a.score);
    
    return clientItems.slice(0, topK);

  } catch (error) {
    console.error("[Frontend] Python sunucusuna bağlanırken kritik hata:", error);
    return [];
  }
}