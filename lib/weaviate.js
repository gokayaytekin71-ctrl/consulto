// lib/weaviate.js
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";

const WEAVIATE_URL = process.env.WEAVIATE_URL || "http://51.159.28.179:8181";
const WEAVIATE_CLASS_NAME = process.env.WEAVIATE_CLASS_NAME || "HukukBelgesiV11_BGEM3_Context_Norm";
const EMBED_API_URL = process.env.EMBED_API_URL || "http://51.159.28.179:5002";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ——— 1) GEMINI FLASH İLE SORGULARI YOĞUNLAŞTIRMA (app.py'deki BEST_CONDENSE_PROMPT mantığı)
async function condenseQueryBest(userQuery) {
  if (!userQuery || !userQuery.trim()) return "";
  if (!GEMINI_API_KEY) return userQuery; // API key yoksa orijinali döndür

  const prompt = `Sana verilen uzun ve karmaşık Türkçe hukuk sorusunu, vektör arama için optimize edilmiş, 4-8 kelimelik, son derece yoğun bir anahtar kelime öbeğine dönüştür. Soru veya cümle kurma. Bağlaç, edat, soru eki gibi gereksiz her şeyi at. Sadece hukuki kavramları ve olayın özünü bırak. Aşağıdaki örnekleri incele ve aynı dönüşümü yap.

--- ÖRNEKLER ---
Soru: Kiracım 3 aydır kirayı ödemiyor, ihtarname de çektim ama sonuç alamadım. Nasıl tahliye edebilirim?
Cevap: kira temerrüt ihtarname tahliye davası icra takibi TBK 315

Soru: İş yerinde amirim sürekli bağırıyor ve diğer çalışanların önünde beni küçük düşürüyor, bu mobbing sayılır mı? Ne gibi haklarım var?
Cevap: işyeri mobbing psikolojik taciz manevi tazminat haklı fesih ispat
--- SON ÖRNEKLER ---

Şimdi bu soruyu dönüştür: ${userQuery}`;

  try {
    // En hızlı ve ucuz model (Flash)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, topK: 32, maxOutputTokens: 100 }
    });
    
    let text = result.response.text() || "";
    text = text.split("\n")[0].trim(); // Sadece ilk satırı al
    return text || userQuery;
  } catch (error) {
    console.warn("Gemini Condense Hatası, orijinal sorgu kullanılacak:", error.message);
    return userQuery;
  }
}

// ——— 2) SORGULARI TEMİZLEME (app.py'deki _post_process_query mantığı)
const TR_STOP_WORDS = new Set(["nasıl","nedir","mı","mi","mu","mü","mısın","misin","musun","müsün","şekilde","şekli","olarak","hakkında","ile","ve","veya","ya","de","da","bu","şu","o","bir","hangi","ne","ki","ama","fakat","ancak","gibi","yapılan","edilen","olan","var","yok"]);

function postProcessQuery(q) {
  let t = q.toLowerCase()
    .replaceAll("ç", "c").replaceAll("ğ", "g").replaceAll("ı", "i")
    .replaceAll("ö", "o").replaceAll("ş", "s").replaceAll("ü", "u");

  // Noktalama ve rakam temizliği
  t = t.replace(/["'“”‘’\?\.\!,;:()\[\]{}]/g, " ");
  t = t.replace(/\s+/g, " ").trim();

  // Stop words temizliği
  let toks = t.split(" ").filter(w => !TR_STOP_WORDS.has(w) && w.length > 2);
  t = toks.join(" ");

  // app.py Alan ipuçları (Heuristics)
  if (t.includes("senet") && !t.includes("kambiyo") && !t.includes("bono")) t += " kambiyo senedi bono";
  if ((t.includes("sifahen") || t.includes("sozlu")) && !t.includes("hmk 200")) t += " hmk 200 yazili delil";
  if (t.includes("noter") && !t.includes("hmk 205")) t += " tbk 12 sozlesme sekli hmk 205 resmi senet";

  return t.slice(0, 160); // Maksimum uzunluk
}

// ——— Embed API
async function embed(text) {
  const r = await fetch(`${EMBED_API_URL}/embed`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error(`embed_api ${r.status}`);
  const j = await r.json();
  return j.vector;
}

// ——— SADECE NEAR VECTOR ARAMASI (BM25 YOK - app.py mantığı)
async function searchNearVector(vector, limit = 60) {
  const query = `
    query Near($vec:[Float!]!) {
      Get {
        ${WEAVIATE_CLASS_NAME}(
          nearVector: { vector: $vec }
          where: {
            operator: Or,
            operands: [
              {path:["kaynak_turu"], operator:Equal, valueString:"ai_ozet"},
              {path:["kaynak_turu"], operator:Equal, valueString:"yargi_karari"}
            ]
          }
          limit: ${limit}
        ){
          metin_parcasi kaynak_turu orijinal_karar_id dosya_adi mahkeme esas_no karar_no benzersiz_id_str
          _additional { distance score }
        }
      }
    }
  `;
  
  const r = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { vec: vector } }),
  });
  const j = await r.json();
  return j.data?.Get?.[WEAVIATE_CLASS_NAME] || [];
}

// ——— Çeşitlilik Filtresi (app.py'deki _diversify mantığı)
function diversify(results, perId = 3, perCourt = 35) {
  const byId = {};
  const byCourt = {};
  const out = [];

  for (const r of results) {
    const rid = r.orijinal_karar_id || r.dosya_adi;
    const crt = (r.mahkeme || "?").toLowerCase().trim();

    if (rid) {
      const cnt = byId[rid] || 0;
      if (cnt >= perId) continue;
      byId[rid] = cnt + 1;
    }

    const c = byCourt[crt] || 0;
    if (c >= perCourt) continue;
    byCourt[crt] = c + 1;

    out.push(r);
  }
  return out;
}

// ——— ANA FONKSİYON ———
export async function semanticSearchWithSnippets(userQuery, topK = 35) {
  if (!userQuery) return [];

  // 1. LLM ile sorguyu hukuki anahtar kelimelere daralt (app.py)
  const condensed = await condenseQueryBest(userQuery);
  
  // 2. Noktalama, edat temizliği ve heuristik eklemeler (app.py)
  const effectiveQuery = postProcessQuery(condensed);
  console.log(`[Search] Orijinal: "${userQuery}" -> Effective: "${effectiveQuery}"`);

  // 3. Vektör oluştur
  const vec = await embed(effectiveQuery);

  // 4. SADECE NearVector araması yap (BM25 karmaşası yok)
  let rawResults = await searchNearVector(vec, topK * 3);

  // 5. ai_ozet'leri filtrele ve UI için map'le
  rawResults = rawResults.filter(r => r.kaynak_turu !== "ai_ozet");

  // 6. Çeşitlendir (Aynı mahkemeden ve dosyadan yığılmayı önle)
  let uniqueResults = diversify(rawResults, 3, 35).slice(0, topK);

  // 7. Frontend formatına dönüştür ve GERÇEK SKORU (Distance) hesapla
  let clientItems = uniqueResults.map(r => {
    const distance = r._additional?.distance ?? 1; // Distance 0'a ne kadar yakınsa o kadar benzer
    
    // GERÇEK EŞLEŞME YÜZDESİ (Yapay şişirme YOK)
    // Distance genellikle 0.15 (Çok iyi) ile 0.65 (Çok kötü) arası gelir.
    let absoluteScore = Math.max(0, 1 - distance);

    return {
      id: r.benzersiz_id_str || Math.random().toString(),
      typeLabel: r.mahkeme || "Yargıtay Kararı",
      code: (r.esas_no && r.karar_no) ? `${r.esas_no} E. ${r.karar_no} K.` : "",
      snippet: r.metin_parcasi,
      // Gerçek skoru atıyoruz. Yapay UI normalizasyonunu (normalizeScoresForUI) SİLDİK.
      score: absoluteScore 
    };
  });

  // Skora göre (en yüksekten en düşüğe) sırala
  clientItems.sort((a, b) => b.score - a.score);

  return clientItems;
}