// lib/weaviate.js
// 3 katmanlı arama: varyantlar → (BM25 + nearVector) → RRF → final sıralama → çeşitlilik

import prisma from '@/lib/prisma';

const WEAVIATE_URL =
  process.env.WEAVIATE_URL || "http://51.159.28.179:8181";
const WEAVIATE_CLASS_NAME =
  process.env.WEAVIATE_CLASS_NAME || "HukukBelgesiV11_BGEM3_Context_Norm";
const EMBED_API_URL =
  process.env.EMBED_API_URL || "http://51.159.28.179:5002";

// ——— Varyant üretimi (Gürültüden arındırılmış ve dinamik)
function makeVariants(q) {
  q = (q || "").trim();
  if (!q) return [];
  const variants = [];

  variants.push(q);

  // Stop-word temizliği: Davanın özüne odaklanmak için gereksiz kelimeleri at
  const cleanQ = q.replace(/\b(davası|dava|davasında|kararı|kararları|karar|hakkında|ilişkin)\b/gi, "").trim() || q;
  if (cleanQ !== q && cleanQ.length > 2) {
    variants.push(cleanQ);
  }

  const toks = cleanQ.split(/\s+/);
  if (toks.length > 3) {
    const uniq = Array.from(new Set(toks));
    if (uniq.length !== toks.length) variants.push(uniq.join(" "));
  }

  const low = cleanQ.toLowerCase();
  if (low.includes("kira")) variants.push(cleanQ + " TBK 315 tahliye temerrüt");
  if (/(mobbing|psikolojik|işçi|işveren|iş hukuku)/i.test(cleanQ))
    variants.push(cleanQ + " iş hukuku psikolojik taciz manevi tazminat");
  if (/(izale|ortaklığın giderilmesi)/i.test(cleanQ))
    variants.push(cleanQ + " paydaş paylı mülkiyet aynen taksim satış");

  const out = [];
  const seen = new Set();
  for (const v of variants) {
    if (!seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out.slice(0, 4);
}

// ——— Embed API çağrısı
async function embed(text) {
  const r = await fetch(`${EMBED_API_URL}/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error(`embed_api ${r.status}`);
  const j = await r.json();
  return j.vector;
}

// ——— Weaviate GraphQL çağrısı
async function gql(query, variables) {
  const r = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`Weaviate GQL ${r.status} ${txt}`);
  }
  const j = await r.json();
  if (j.errors?.length) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

// ——— Weaviate cevabını normalize et
function mapGetResults(arr) {
  return (arr || []).map((x) => {
    const add = x?._additional || {};
    return {
      properties: x,
      distance: typeof add.distance === "number" ? add.distance : null,
      score: typeof add.score === "number" ? add.score : null,
      certainty: typeof add.certainty === "number" ? add.certainty : null,
    };
  });
}

// ——— BM25 + NearVector (ikisini de getir)
async function searchHybridAndNear(variant, vector, whereFilter, props, limit = 60) {
  const propSel = props.join("\n");
  const WHERE = whereFilter ? `where:${whereFilter}` : "";

  // 1) BM25 (vektörizer gerektirmez)
  const qBM25 = `
    query BM($q:String!) {
      Get {
        ${WEAVIATE_CLASS_NAME}(
          bm25:{query:$q}
          ${WHERE ? WHERE : ""}
          limit:${limit}
        ){
          ${propSel}
          _additional{ score }
        }
      }
    }
  `;
  const dBM25 = await gql(qBM25, { q: variant });

  // 2) NEAR VECTOR
  const qNear = `
    query Near($vec:[Float!]!) {
      Get {
        ${WEAVIATE_CLASS_NAME}(
          nearVector:{vector:$vec}
          ${WHERE ? WHERE : ""}
          limit:${limit}
        ){
          ${propSel}
          _additional{ distance }
        }
      }
    }
  `;
  const dNear = await gql(qNear, { vec: vector });

  const hybridRaw = dBM25?.Get?.[WEAVIATE_CLASS_NAME] || [];
  const hybrid = mapGetResults(hybridRaw);

  const nearRaw = dNear?.Get?.[WEAVIATE_CLASS_NAME] || [];
  const near = mapGetResults(nearRaw);

  return { hybrid, near };
}

// ——— RRF birleştirme
function rrfMerge(lists, k = 60) {
  const keyOf = (it) => {
    const p = it.properties || {};
    if (p.benzersiz_id_str) return p.benzersiz_id_str;
    if (p.orijinal_karar_id != null && p.parca_no != null)
      return `${p.orijinal_karar_id}#${p.parca_no}`;
    if (p.dosya_adi && p.parca_no != null)
      return `${p.dosya_adi}#${p.parca_no}`;
    return p.orijinal_karar_id || p.dosya_adi || String(p.metin_parcasi || "").slice(0, 80);
  };
  const rank = {};
  for (const L of lists) {
    L.forEach((it, idx) => {
      const key = keyOf(it);
      if (!key) return;
      if (!rank[key]) rank[key] = { item: it, score: 0 };
      rank[key].score += 1 / (k + idx + 1);
    });
  }
  return Object.values(rank)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}

// ——— Combined score (distance/score/certainty karması)
function combinedScore(r) {
  let s = 0;
  if (typeof r.score === "number") s += r.score;
  if (typeof r.distance === "number") s += Math.max(0, 1 - r.distance);
  if (typeof r.certainty === "number") s += r.certainty;
  return s;
}

// ——— TR normalizasyonu + tokenizasyonu + skorlayıcılar
function normalizeTR(s = "") {
  return (s || "")
    .toString()
    .toLowerCase()
    .replaceAll("ç","c").replaceAll("ğ","g").replaceAll("ı","i")
    .replaceAll("ö","o").replaceAll("ş","s").replaceAll("ü","u");
}

function tokenizeTR(s = "") {
  return normalizeTR(s)
    .replace(/[^^\p{L}0-9\s]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// Sorgu ↔ metin kelime örtüşmesi (0..1)
function textOverlapScore(query = "", text = "") {
  const qs = new Set(tokenizeTR(query));
  const ts = new Set(tokenizeTR(text));
  if (qs.size === 0 || ts.size === 0) return 0;
  let hit = 0;
  for (const t of qs) if (ts.has(t)) hit++;
  return hit / qs.size; // recall
}

// Tam ifade/bigram eşleşmesi (0..1)
function phraseHitScore(query = "", text = "") {
  const q = normalizeTR(query).trim();
  if (!q) return 0;
  const t = normalizeTR(text);
  if (t.includes(q)) return 1; 
  const parts = q.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const bigram = `${parts[0]} ${parts[1]}`;
    if (t.includes(bigram)) return 0.6;
  }
  return 0;
}

// Dizi içindeki Keyword'leri bağımsız olarak kontrol etme (False-positive önleyici)
function keywordMatchScore(query = "", keywordsArr = []) {
  const q = normalizeTR(query).trim();
  if (!q || !keywordsArr.length) return 0;
  
  let bestScore = 0;
  for (const kw of keywordsArr) {
    const normKw = normalizeTR(kw).trim();
    if (normKw === q) return 1; // Tam eşleşme
    if (normKw.includes(q) || q.includes(normKw)) {
      bestScore = Math.max(bestScore, 0.6); // Kısmi/Bigram eşleşme
    }
  }
  return bestScore;
}

// ——— UI için skor normalizasyonu (0..1)
function normalizeScoresForUI(items) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return arr;

  const vals = arr
    .map(x => typeof x.score === "number" ? x.score : null)
    .filter(v => v != null && !Number.isNaN(v));

  if (!vals.length) return arr;

  const sorted = [...vals].sort((a, b) => a - b);
  const p = (z) => {
    if (sorted.length === 1) return sorted[0];
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((z / 100) * (sorted.length - 1))));
    return sorted[idx];
  };
  let min = p(5);
  let max = p(95);
  if (max - min < 1e-9) { 
    for (const x of arr) {
      x.scoreRaw = x.score;
      x.score = 0.75;
    }
    return arr;
  }

  for (const x of arr) {
    const v = (typeof x.score === "number" ? x.score : min);
    const ui = Math.max(0, Math.min(1, (v - min) / (max - min)));
    x.scoreRaw = x.score;
    x.score = ui;
  }
  return arr;
}

// ——— Çeşitlilik filtresi
function diversify(arr, perId = 3, perCourt = 10) {
  const byId = {};
  const byCourt = {};
  const out = [];
  for (const r of arr) {
    const p = r.properties || {};
    const rid = p.orijinal_karar_id || p.dosya_adi || null;
    const crt = (p.mahkeme || "?").toString().trim().toLowerCase();

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

// --- Sadece listede göstermek için: aynı kararı tekille
function dedupeByCodeAndType(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const t = (it.typeLabel || it.mahkeme || "").toString().trim().toLowerCase();
    const c = (it.code || "").toString().trim();
    if (t && c) {
      const key = `${t}|${c}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(it);
      continue;
    }
    const k2 = `#${it.slug || it.id}`;
    if (seen.has(k2)) continue;
    seen.add(k2);
    out.push(it);
  }
  return out;
}

// ——— Yardımcı: OR filtresi üret
function buildOrFilter(field, values = []) {
  const vals = (values || []).map((v) => String(v)).filter(Boolean);
  if (!vals.length) return "";
  const ops = vals
    .map((v) => `{path:["${field}"], operator:Equal, valueString:${JSON.stringify(v)}}`)
    .join(",");
  return `{ operator: Or, operands: [${ops}] }`;
}

// ——— Prisma: karar meta getir
async function fetchPrismaMetaBySlugs(slugs = []) {
  const arr = (slugs || []).filter(Boolean);
  if (!arr.length) return new Map();
  const rows = await prisma.karar.findMany({
    where: { fileName: { in: arr.map(s => `${s}.txt`) } },
    select: { fileName: true, type: true, code: true, keywords: true },
  });
  const map = new Map();
  for (const r of rows) {
    const slug = (r.fileName || '').replace(/\.txt$/i, '');
    const keywordsRaw = r.keywords;
    let keywordsArr = [];
    if (typeof keywordsRaw === 'string') {
      keywordsArr = keywordsRaw.split(',').map(kw => kw.trim()).filter(Boolean);
    } else if (Array.isArray(keywordsRaw)) {
      keywordsArr = keywordsRaw.filter(Boolean);
    }
    if (slug) map.set(slug, { type: r.type || null, code: r.code || null, keywordsArr });
  }
  return map;
}

// ——— Top kararlar için ai_ozet kayıtlarını çek
async function fetchAiOzetMapByIds({ rids = [], fnames = [] }) {
  const out = Object.create(null);

  if (rids.length) {
    const whereRid = `
      {
        operator: And,
        operands: [
          {path:["kaynak_turu"], operator:Equal, valueString:"ai_ozet"},
          ${buildOrFilter("orijinal_karar_id", rids)}
        ]
      }
    `;
    const q1 = `
      query {
        Get {
          ${WEAVIATE_CLASS_NAME}(
            where:${whereRid}
            limit:${Math.max(300, rids.length)}
          ){
            orijinal_karar_id
            dosya_adi
            metin_parcasi
          }
        }
      }
    `;
    const d1 = await gql(q1);
    const arr1 = d1?.Get?.[WEAVIATE_CLASS_NAME] || [];
    for (const it of arr1) {
      const k = it?.orijinal_karar_id;
      if (k && !out[k]) out[k] = it?.metin_parcasi || "";
    }
  }

  const needByFile = (fnames || []).filter((f) => f && !out[f]);
  if (needByFile.length) {
    const whereFile = `
      {
        operator: And,
        operands: [
          {path:["kaynak_turu"], operator:Equal, valueString:"ai_ozet"},
          ${buildOrFilter("dosya_adi", needByFile)}
        ]
      }
    `;
    const q2 = `
      query {
        Get {
          ${WEAVIATE_CLASS_NAME}(
            where:${whereFile}
            limit:${Math.max(300, needByFile.length)}
          ){
            orijinal_karar_id
            dosya_adi
            metin_parcasi
          }
        }
      }
    `;
    const d2 = await gql(q2);
    const arr2 = d2?.Get?.[WEAVIATE_CLASS_NAME] || [];
    for (const it of arr2) {
      const f = it?.dosya_adi;
      if (f && !out[f]) out[f] = it?.metin_parcasi || "";
    }
  }

  return out;
}

// ——— Ana fonksiyon: 3 katmanlı semantik arama
export async function semanticSearchWithSnippets(query, topK = 60) {
  const q = (query || "").trim();
  if (!q) return [];

  const vec = await embed(q);
  const variants = makeVariants(q);

  const whereKarar = `
    {
      operator: Or,
      operands: [
        {path:["kaynak_turu"], operator:Equal, valueString:"ai_ozet"},
        {path:["kaynak_turu"], operator:Equal, valueString:"yargi_karari"}
      ]
    }
  `;
  const kararProps = [
    "metin_parcasi",
    "kaynak_turu",
    "orijinal_karar_id",
    "dosya_adi",
    "mahkeme",
    "esas_no",
    "karar_no",
    "karar_tarihi",
    "parca_no",
    "benzersiz_id_str",
  ];

  const lists = [];
  for (const v of variants) {
    const { hybrid, near } = await searchHybridAndNear(
      v, vec, whereKarar, kararProps, 60
    );
    lists.push(hybrid);
    lists.push(near);
  }

  let merged = rrfMerge(lists);

  merged.sort((a, b) => combinedScore(b) - combinedScore(a));

  const preSlice = Math.max(topK * 12, 400);
  merged = merged.slice(0, preSlice);

  merged = merged.filter(
    it => String(it?.properties?.kaynak_turu || '').toLowerCase() !== 'ai_ozet'
  );

  const uniquePerDecision = diversify(merged, 1, 20).slice(0, topK);

  const ridList = Array.from(new Set(uniquePerDecision.map(it => it?.properties?.orijinal_karar_id).filter(Boolean)));
  const fnameList = Array.from(new Set(uniquePerDecision.map(it => it?.properties?.dosya_adi).filter(Boolean)));
  const aiOzetMap = await fetchAiOzetMapByIds({ rids: ridList, fnames: fnameList });

  const slugsForPrisma = Array.from(new Set(
    uniquePerDecision
      .map(it => (it?.properties?.dosya_adi || '').replace(/\.txt$/i, ''))
      .filter(Boolean)
  ));
  const metaBySlug = await fetchPrismaMetaBySlugs(slugsForPrisma);

  let clientItems = mapToClient(uniquePerDecision, aiOzetMap, metaBySlug);

  // Yeniden Skorlama (Re-ranking)
  for (const it of clientItems) {
    const base = (typeof it.score === 'number' ? it.score : 0);

    const baglam = `${it.snippet || ''} ${it.typeLabel || ''} ${it.code || ''}`;
    const ov = textOverlapScore(q, baglam);       
    const phr = phraseHitScore(q, baglam);        
    const lexical = Math.min(1, 0.55 * ov + 0.65 * phr);

    // Yeni ve güvenli Keyword eşleştirme mantığı
    const kwArr = Array.isArray(it.keywords) ? it.keywords : [];
    const kwText = kwArr.join(' ');
    
    const kwOv = textOverlapScore(q, kwText);
    const kwPhr = keywordMatchScore(q, kwArr); // Artık birleştirilmiş metne değil, dizi elemanlarına tek tek bakıyor
    
    const kwLex = Math.min(1, 0.40 * kwOv + 1.00 * kwPhr); 

    it.score = base + 1.2 * lexical + 2.2 * kwLex;
  }

  clientItems = normalizeScoresForUI(clientItems);
  clientItems = dedupeByCodeAndType(clientItems).slice(0, topK);
  return clientItems;
}

function deduceCode(p = {}) {
  const clean = (s) => (s || "").toString().trim();
  const bad = (s) => !s || /^belirtilmemi[şs]/i.test(s) || /^n\/?a$/i.test(s);

  const esas = clean(p.esas_no);
  const karar = clean(p.karar_no);

  if (!bad(esas) && !bad(karar)) {
    return `${esas} E. ${karar} K.`;
  }

  const fname = clean(p.dosya_adi);
  if (fname) {
    const m1 = fname.match(/^(\d+)_Hukuk_Dairesi_(\d{4}-[0-9A-Za-z()\-\/]+)E_(\d{4}-[0-9A-Za-z()\-\/]+)K\.txt$/i);
    if (m1) {
      const ePart = m1[2].replace(/\s*-\s*/g, '/');
      const kPart = m1[3].replace(/\s*-\s*/g, '/');
      return `${ePart} E. ${kPart} K.`;
    }
    const m2 = fname.match(/^(Hukuk|Ceza)_Genel_Kurulu_(\d{4}-[0-9A-Za-z()\-\/]+)E_(\d{4}-[0-9A-Za-z()\-\/]+)K\.txt$/i);
    if (m2) {
      const kurul = /Hukuk/i.test(m2[1]) ? 'Hukuk Genel Kurulu' : 'Ceza Genel Kurulu';
      const ePart = m2[2].replace(/\s*-\s*/g, '/');
      const kPart = m2[3].replace(/\s*-\s*/g, '/');
      return `${kurul} ${ePart} E. ${kPart} K.`;
    }
  }

  return "";
}

// ——— Frontend’e map
function mapToClient(items, aiOzetMap = {}, metaBySlug = new Map()) {
  return items.map((it, idx) => {
    const p = it.properties || {};
    const rid = p.orijinal_karar_id || null;
    const fname = p.dosya_adi || null;
    const chunkNo = (p.parca_no != null ? String(p.parca_no) : null);
    const uniq = p.benzersiz_id_str ||
                 (rid && chunkNo ? `${rid}_${chunkNo}` : null) ||
                 (fname && chunkNo ? `${fname}_${chunkNo}` : null) ||
                 `k_${idx}_${Math.random().toString(36).slice(2)}`;

    const slug = String(fname || rid || uniq).replace(/\.txt$/i, "");
    const meta = metaBySlug.get(slug) || null;

    return {
      id: uniq,
      slug,
      type:
        (p.kaynak_turu && String(p.kaynak_turu).toLowerCase() === "mevzuat")
          ? "mevzuat"
          : "yargi_karari",
      typeLabel: meta?.type || p.mahkeme || null,        
      code: meta?.code || deduceCode(p),                  
      mahkeme: p.mahkeme || null,                         
      snippet: p.metin_parcasi || "",
      aiSummary: aiOzetMap[rid] || aiOzetMap[fname] || "",
      keywords: (meta?.keywordsArr || []),
      score: (typeof it.distance === "number" ? 1 - it.distance : (combinedScore(it) || 0.1)),
    };
  });
}