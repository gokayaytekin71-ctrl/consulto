import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import cliProgress from 'cli-progress';

const prisma = new PrismaClient();
const CWD = process.cwd();
const mevzuatPath = path.join(CWD, 'veri/mevzuat');
const kararPath   = path.join(CWD, 'veri/kararlar');
const summaryPath = path.join(CWD, 'veri/summaries');

// ─── Yardımcı Fonksiyonlar ─────────────────────────────────────────────────────

/**
 * Klasörün altındaki tüm dosyaları (alt klasörler dahil) toplu olarak getirir.
 */
async function getAllFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async e => {
    const res = path.join(dir, e.name);
    return e.isDirectory() ? getAllFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

/**
 * Dosya adından okunabilir mevzuat başlığı üretir.
 * Örn: "6098_TÜRK_BORÇLAR_KANUNU.json" -> "TÜRK BORÇLAR KANUNU"
 */
function generateNameFromKey(key) {
  return key
    .replace(/\.json$/i, '')
    .replace(/^\d+_/, '')
    .replace(/_/g, ' ');
}

/**
 * Ham "Yargıtay 1 HD" vb. metnini standart formata çevirir.
 * Artık hiçbir daire adının başına "Yargıtay" ön ekini eklemez.
 */
function normalizeDaireAdi(name) {
  if (!name || typeof name !== 'string') return null;

  // Baştaki "Yargıtay" kelimesini temizle (eğer varsa).
  let clean = name.replace(/^Yargıtay\s*/i, '').trim();

  // "DAİRESİ" veya "DAIRESI" son ekini standart " Dairesi" yap
  clean = clean
    .replace(/\s*DAİRESİ$/i, ' Dairesi')
    .replace(/\s*DAIRESI$/i, ' Dairesi')
    .trim();
  
  // "1 HD" -> "1. Hukuk Dairesi" veya "1 CD" -> "1. Ceza Dairesi"
  clean = clean.replace(
    /^(\d+)\s+(Hukuk Dairesi|Ceza Dairesi)/i,
    '$1. $2'
  );
  
  if (clean.endsWith('HD')) clean = clean.replace(/HD$/, ' Hukuk Dairesi');
  if (clean.endsWith('CD')) clean = clean.replace(/CD$/, ' Ceza Dairesi');

  // "Hukuk Genel Kurulu" veya "Ceza Genel Kurulu" isimlerini de "Yargıtay" ön eki olmadan döndür.
  if (/Hukuk Genel Kurulu|HGK/i.test(clean)) return 'Hukuk Genel Kurulu';
  if (/Ceza Genel Kurulu|CGK/i.test(clean)) return 'Ceza Genel Kurulu';

  return clean || null; // Boşsa null döndür
}

/**
 * "2020-603E" veya "2008/4-558 E." veya "2010/4-191(BİDAYET) E." gibi numarayı
 * "E. 2008/4-558" formatına çevirir.
 */
function formatEsasKararKodu(numStr, designator) {
  if (!numStr) return null;

  let clean = String(numStr)
    // baştaki "Esas"/"Karar" veya "E."/"K." kırp
    .replace(/^(?:Esas|Karar|E|K)\s*\.?\s*/i, '')
    // sondaki "E."/"K." veya "Esas"/"Karar" kırp
    .replace(/\s*(?:Esas|Karar|[EK])\.?\s*$/i, '')
    // sondaki virgül/nokta/boşlukları kırp
    .replace(/[,\.\s]+$/,'')
    .trim();

  // Eğer zaten (BİDAYET) parantezliyse dokunma; değilse ve bitişik yazılmışsa parantezle
  if (!/\(.*B[İI]DAYET.*\)/i.test(clean)) {
    // örn: 191Bidayet, 4-191Bidayet, 2010/4-191Bidayet
    clean = clean.replace(/(\d)\s*(B[İI]DAYET)/gi, (_, d, word) => `${d}(${word.toUpperCase()})`);
  }

  // ayraç çevresindeki boşlukları sadeleştir (2010 / 5 - 142 -> 2010/5-142)
  clean = clean
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  return `${clean} ${designator.toUpperCase()}.`;
}


/**
 * Dosya adı (slug) ve içerik üzerinden "type" ve "code" çıkarır.
 */
function parseKararInfo(slug, content) {
  // 1. Dosya adından dene (Örn: 1_Hukuk_Dairesi_2020_1234E_5678K.txt)
  // Bu kısım, dosya adlarının formatına göre çalışır.
  const parts = slug.split('_');
  if (parts.length >= 3) {
    const kRaw = parts[parts.length - 1]; // Son kısım: 5678K
    const eRaw = parts[parts.length - 2]; // Sondan ikinci kısım: 1234E
    const typeRawParts = parts.slice(0, -2); // Geri kalan: 1, Hukuk, Dairesi
    const typeRaw = typeRawParts.join(' '); // Birleştir: 1 Hukuk Dairesi

    // Esas ve Karar kodlarının formatını kontrol et
    if (/[EK]$/i.test(eRaw) && /[EK]$/i.test(kRaw)) {
      const esas  = formatEsasKararKodu(eRaw, 'E');
      const karar = formatEsasKararKodu(kRaw, 'K');
      if (esas && karar) {
        return {
          // normalizeDaireAdi artık "Yargıtay" eklemeyecek, sadece temizleyecek.
          type: normalizeDaireAdi(typeRaw) || 'Bilinmeyen Daire',
          code: `${esas} ${karar}`
        };
      }
    }
  }

  // 2. İçerikten başlık satırından dene (Örn: Hukuk Genel Kurulu 2010/4-191(BİDAYET) E. , 2010/162 K.)
  const lines = content.split(/\r?\n/).slice(0, 10); // İlk 10 satırı kontrol et
  for (let line of lines) {
    // "191Bidayet" gibi bitişik yazımları, eşleşmeyi kolaylaştırmak için görünür/parantezli hale getir
    line = line.replace(/(\d)\s*(B[İI]DAYET)/gi, (_, d, w) => `${d}(${w.toUpperCase()})`);

    // Daha esnek bir regex:
    // - Daire adını (tRaw) yakalar.
    // - Esas numarasını (m[2]) yakalar: Sayılar, /, -, parantez içindeki metinler, ardından opsiyonel E/Esas ve nokta.
    // - Karar numarasını (m[3]) yakalar: Sayılar, /, -, ardından opsiyonel K/Karar ve nokta.
    // - Esas ve Karar arasında opsiyonel virgül ve boşlukları kabul eder.
    const m = line.match(
      /^(.*?)\s+((?:(?:E|Esas)\.?\s*)?[\d\/\-\(\)\w\s]+(?:\s*E\.?)?)\s*,?\s*((?:(?:K|Karar)\.?\s*)?[\d\/\-\(\)\w\s]+(?:\s*K\.?)?)$/i
    );

    if (m) {
      const tRaw = m[1].trim();
      const esas  = formatEsasKararKodu(m[2], 'E');
      const karar = formatEsasKararKodu(m[3], 'K');
      if (esas && karar) {
        return {
          // normalizeDaireAdi artık "Yargıtay" eklemeyecek, sadece temizleyecek.
          type: normalizeDaireAdi(tRaw) || 'Bilinmeyen Daire',
          code: `${esas} ${karar}`
        };
      }
    }
  }
  
  // 3. Son çare: dosya adından sadece type tahmini
  // Bu kısım, dosya adının başında "Yargıtay" yoksa bile doğru daire adını çıkarır.
  return {
    type: parts.length > 2
      ? normalizeDaireAdi(parts.slice(0, -2).join(' '))
      : 'Bilinmeyen Daire',
    code: null
  };
}

// ─── AI Özetlerini Yükle ────────────────────────────────────────────────────────

// Esnek özet/anahtar kelime ayırıcı: "Anahtar Kelime", "Anahtar Kelimeler", "Keywords" vb. varyantları yakalar.
// Kalın/italik işaretleri, farklı iki nokta sembollerini ve tire kullanımını tolere eder.
const markerRegex = /(^|\n)\s*(?:\*{0,2}\s*)?(?:Anahtar\s*Kelime(?:ler)?|Keywords?)\s*(?:\*{0,2}\s*)?[:：\-]?\s*/gi;

function splitSummaryAndKeywords(raw) {
  if (!raw || typeof raw !== 'string') return { summ: null, keywords: null };

  const text = raw.trim();
  const matches = [...text.matchAll(markerRegex)];
  if (matches.length === 0) {
    // Marker yoksa: sonda tek harf/satır artığı (örn. "\nA") temizle
    const cleaned = text.replace(/\n+[A-Za-zÇĞİÖŞÜÂÎÛ]\s*$/u, '').trim();
    return { summ: cleaned, keywords: null };
  }

  // Son eşleşmeyi kullan
  const last = matches[matches.length - 1];
  const idx = last.index ?? -1;
  if (idx === -1) {
    const cleaned = text.replace(/\n+[A-Za-zÇĞİÖŞÜÂÎÛ]\s*$/u, '').trim();
    return { summ: cleaned, keywords: null };
  }

  const before = text.slice(0, idx).trimEnd();
  const after  = text.slice(idx + last[0].length).trim();

  // Marker var ama keywords boş veya anlamsızsa, keywords=null olarak bırak
  if (!after || after.length < 2) {
    const cleanedBefore = before.replace(/\n+[A-Za-zÇĞİÖŞÜÂÎÛ]\s*$/u, '').trim();
    return { summ: cleanedBefore, keywords: null };
  }

  return { summ: before, keywords: after };
}

async function loadAiSummaries() {
  const map = new Map();
  try {
    const files = (await getAllFiles(summaryPath)).filter(f => f.toLowerCase().endsWith('.txt'));
    console.log(`[loadAiSummaries] ${files.length} özet dosyası bulundu (alt klasörler dahil).`); // Debug
    for (const fp of files) {
      const file = path.basename(fp);
      try {
        const txt = await fs.readFile(fp, 'utf-8');
        for (const line of txt.split(/\r?\n/).filter(Boolean)) {
          try {
            const obj = JSON.parse(line);
            const { id, file: fileField, summary } = obj;
            if ((!id && !fileField) || typeof summary !== 'string') {
                console.warn(`[loadAiSummaries] Geçersiz özet satırı atlandı (id/file veya summary eksik): ${line.substring(0, Math.min(line.length, 50))}...`); // Debug
                continue;
            }
            const { summ, keywords } = splitSummaryAndKeywords(summary);
            // sonda kalan tek harf/satır artıklarına karşı ekstra güvenlik
            const safeSumm = (summ || '').replace(/\n+[A-Za-zÇĞİÖŞÜÂÎÛ]\s*$/u, '').trim();
            const val = { summary: safeSumm || null, keywords: (keywords && keywords.trim()) ? keywords.trim() : null };
            // 1) id ile indeksle
            if (id && typeof id === 'string' && id.trim()) {
              map.set(id.trim(), val);
            }
            // 2) file alanı ile de indeksle (uzantısız)
            if (fileField && typeof fileField === 'string' && fileField.trim()) {
              const base = fileField.trim().replace(/\.txt$/i, '');
              map.set(base, val);
            }
          } catch (parseError) {
            console.error(`[loadAiSummaries] JSON ayrıştırma hatası: ${file} dosyasındaki satır: ${line.substring(0, Math.min(line.length, 100))}... Hata:`, parseError.message); // Debug
          }
        }
      } catch (readFileError) {
        console.error(`[loadAiSummaries] Dosya okuma hatası: ${file}. Hata:`, readFileError.message); // Debug
      }
    }
  } catch (dirError) {
    console.error(`[loadAiSummaries] Özet dizini (${summaryPath}) okuma hatası:`, dirError.message); // Debug
  }
  console.log(`[loadAiSummaries] Toplam ${map.size} özet haritaya yüklendi.`); // Debug
  return map;
}

// ─── Mevzuat Seed ───────────────────────────────────────────────────────────────

async function seedMevzuat() {
  console.log('▶ Mevzuat verileri işleniyor…');
  const all = (await getAllFiles(mevzuatPath)).filter(f => f.endsWith('.json'));
  const bar = new cliProgress.SingleBar({
    format: 'Mevzuat   |{bar}| {value}/{total}',
  }, cliProgress.Presets.shades_classic);
  bar.start(all.length, 0);

  let done = 0;
  for (const fp of all) {
    const key  = path.basename(fp).replace(/\.json$/i, '');
    const name = generateNameFromKey(key);
    try {
      const content = await fs.readFile(fp, 'utf-8');
      await prisma.mevzuat.upsert({
        where:   { key },
        update:  { name, content },
        create:  { key, name, content }
      });
      done++;
    } catch (e) {
      console.error('⚠️', fp, e.message);
    }
    bar.increment();
  }
  bar.stop();
  console.log(`✅ Mevzuat: ${done}/${all.length} kaydedildi.\n`);
}

// ─── Karar Seed ────────────────────────────────────────────────────────────────

async function seedKararlar() {
  console.log('▶ Karar verileri işleniyor…');
  const summaries = await loadAiSummaries();
  const all = (await getAllFiles(kararPath)).filter(f => f.endsWith('.txt'));
  const bar = new cliProgress.SingleBar({
    format: 'Kararlar   |{bar}| {value}/{total}',
  }, cliProgress.Presets.shades_classic);
  bar.start(all.length, 0);

  let done = 0;
  for (const fp of all) {
    const file    = path.basename(fp);
    const text    = await fs.readFile(fp, 'utf-8');

    // Dosya adı '1_Hukuk_Dairesi_2020_1234E_5678K.txt' ise,
    // slug da '1_Hukuk_Dairesi_2020_1234E_5678K' olacaktır.
    // Bu, AI özetlerindeki ID'lerle eşleşir.
    let baseName = file.replace(/\.txt$/i, '');
    // Ensure slug includes the full baseName up to the last 'K'
    const match = baseName.match(/(.*K)$/i);
    const slug = match ? match[1] : baseName;

    const { type, code } = parseKararInfo(slug, text);
    // slug ile özetleri ara, AI özet ID'leri ile dosya adları aynı olduğu için bu kısım doğru çalışmalı.
    const meta    = summaries.get(slug) || { summary: null, keywords: null };
    if (!summaries.has(slug)) {
      console.warn(`[seedKararlar] AI özeti bulunamadı: ${slug} (file: ${file})`);
    }

    try {
      await prisma.karar.upsert({
        where:   { fileName: file },
        update:  {
          content:       text,
          type,
          code,
          aiSummary:     meta.summary,
          keywords:      meta.keywords,
          contentLength: text.length
        },
        create:  {
          fileName:      file,
          content:       text,
          type,
          code,
          aiSummary:     meta.summary,
          keywords:      meta.keywords,
          contentLength: text.length
        }
      });
      done++;
    } catch (e) {
      console.error('⚠️', file, e.message);
    }
    bar.increment();
  }
  bar.stop();
  console.log(`✅ Kararlar: ${done}/${all.length} kaydedildi.\n`);
}

async function main() {
  console.log('🚀 Seed işlemi başlıyor');
  const start = Date.now();
  await seedMevzuat();
  await seedKararlar();
  const secs = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`🎉 Tüm işlemler ${secs}s içinde tamamlandı.`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ Seed sırasında hata:', e);
  process.exit(1);
});
