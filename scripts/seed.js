import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

// --- VERİTABANI VE DOSYA YOLLARI ---
const prisma = new PrismaClient();
const CWD = process.cwd();
const mevzuatPath = path.join(CWD, 'veri/mevzuat');
const kararPath = path.join(CWD, 'veri/kararlar');
const summaryPath = path.join(CWD, 'veri/summaries');

// --- Recursive file collector for nested directories ---
async function getAllFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

// --- YARDIMCI FONKSİYONLAR ---

/**
 * Mevzuat dosya adından okunabilir bir isim üretir.
 * Örn: "6098_TÜRK_BORÇLAR_KANUNU.json" -> "TÜRK BORÇLAR KANUNU"
 */
function generateNameFromKey(key) {
  return key
    .replace(/\.json$/i, '')
    .replace(/\.txt$/i, '')
    .replace(/^\d+_/, '')
    .replace(/_/g, ' ');
}

/**
 * Ham daire adını standart bir formata getirir.
 * Örn: "Yargıtay 1 HD" -> "1. Hukuk Dairesi"
 */
function normalizeDaireAdi(name) {
  if (!name || typeof name !== 'string') return null;
  let cleanName = name.replace(/^Yargıtay\s*/i, '').trim();
  if (/Hukuk Genel Kurulu|HGK/i.test(cleanName)) return 'Yargıtay HGK';
  if (/Ceza Genel Kurulu|CGK/i.test(cleanName)) return 'Yargıtay CGK';
  cleanName = cleanName
    .replace(/\s*DAİRESİ$/i, ' Dairesi')
    .replace(/\s*DAIRESI$/i, ' Dairesi')
    .trim();
  cleanName = cleanName.replace(
    /^(\d+)\s+(Hukuk Dairesi|Ceza Dairesi|Hukuk Dairesi Bşk|Ceza Dairesi Bşk)/i,
    '$1. $2'
  );
  if (cleanName.endsWith("HD")) cleanName = cleanName.replace(/HD$/, " Hukuk Dairesi");
  if (cleanName.endsWith("CD")) cleanName = cleanName.replace(/CD$/, " Ceza Dairesi");
  return cleanName;
}

/**
 * Ham Esas veya Karar numarasını standart formata çevirir.
 * Örn: ("2020-603E", "E") -> "E. 2020/603 E."
 */
function formatEsasKararKodu(numberString, designator) {
  if (!numberString) return null;
  let cleanNumber = numberString.replace(/[EK\s]/ig, '').trim();
  cleanNumber = cleanNumber.replace(/-/g, '/');
  const letterMatch = numberString.match(/([EK])$/i);
  const letter = letterMatch ? ` ${letterMatch[1].toUpperCase()}.` : '.';
  return `${designator.toUpperCase()}. ${cleanNumber}${letter}`;
}

/**
 * Dosya adı ve içeriği analiz ederek daire adı ve kodu çıkarır.
 */
function parseKararInfo(slug, content) {
  const slugParts = slug.split('_');
  if (slugParts.length >= 3) {
    const kararNoRaw = slugParts[slugParts.length - 1];
    const esasNoRaw = slugParts[slugParts.length - 2];
    const typeRaw = slugParts.slice(0, -2).join(' ');
    if (/[EK]$/i.test(esasNoRaw) && /[EK]$/i.test(kararNoRaw)) {
      const formattedEsas = formatEsasKararKodu(esasNoRaw, 'E');
      const formattedKarar = formatEsasKararKodu(kararNoRaw, 'K');
      return {
        type: normalizeDaireAdi(typeRaw) || 'Bilinmeyen Daire',
        code: `${formattedEsas} ${formattedKarar}`,
      };
    }
  }
  const lines = content.trim().split(/\r?\n/);
  const headerLn = lines.slice(0, 10).find(l => /E\.?\s*,/.test(l) && /K\.?$/i.test(l.trim()));
  if (headerLn) {
    const pattern = /^(.*?)\s+([\d\/\-A-Za-z]+)\s*E\.?\s*,\s*([\d\/\-A-Za-z]+)\s*K\.?$/i;
    const match = headerLn.trim().match(pattern);
    if (match) {
      const [, rawType, rawEsas, rawKarar] = match;
      return {
        type: normalizeDaireAdi(rawType.trim()) || 'Bilinmeyen Daire',
        code: [
          formatEsasKararKodu(rawEsas, 'E'),
          formatEsasKararKodu(rawKarar, 'K'),
        ].join(' ')
      };
    }
  }
  if (slugParts.length > 2) {
    return { type: normalizeDaireAdi(slugParts.slice(0, -2).join(' ')) };
  }
  return { type: 'Bilinmeyen Daire', code: null };
}

// --- ANA SEED FONKSİYONLARI ---

async function seedMevzuat() {
  console.log('Mevzuat verileri işleniyor...');
  try {
    const existing = await prisma.mevzuat.findMany({ select: { key: true } });
    const existingKeys = new Set(existing.map(e => e.key));
    const filePaths = await getAllFiles(mevzuatPath);
    let added = 0;
    for (const filePath of filePaths) {
      const file = path.basename(filePath);
      if (!file.toLowerCase().endsWith('.json')) continue;
      const fileKey = file.replace(/\.json$/i, '');
      if (existingKeys.has(fileKey)) continue;
      const fileName = generateNameFromKey(file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        await prisma.mevzuat.create({ data: { key: fileKey, name: fileName, content } });
        added++;
      } catch (error) {
        console.error(`HATA: ${filePath} işlenemedi.`, error);
      }
    }
    console.log(`✅ ${added} yeni mevzuat eklendi.`);
  } catch (error) {
    console.error('Mevzuat eklenirken hata oluştu:', error);
  }
}

async function loadAiSummaries() {
  const summaryMap = new Map();
  try {
    const files = await fs.readdir(summaryPath);
    for (const file of files) {
      if (!file.toLowerCase().endsWith('.txt')) continue;
      const contentText = await fs.readFile(path.join(summaryPath, file), 'utf-8');
      for (const line of contentText.split(/\r?\n/).filter(Boolean)) {
        try {
          const data = JSON.parse(line);
          if (!data.id || typeof data.summary !== 'string') continue;
          let summary = data.summary;
          let keywords = null;
          const marker = "Anahtar Kelimeler:";
          const idx = summary.toLowerCase().lastIndexOf(marker.toLowerCase());
          if (idx !== -1) {
            keywords = summary.slice(idx + marker.length).trim();
            summary = summary.slice(0, idx).trim();
          }
          summaryMap.set(data.id, { summary, keywords });
        } catch {}
      }
    }
  } catch {}
  return summaryMap;
}

async function seedKararlar() {
  console.log('Karar verileri işleniyor...');
  const summariesDataMap = await loadAiSummaries();
  try {
    const existing = await prisma.karar.findMany({ select: { fileName: true } });
    const existingFiles = new Set(existing.map(e => e.fileName));
    const filePaths = await getAllFiles(kararPath);
    let added = 0;
    for (const filePath of filePaths) {
      const file = path.basename(filePath);
      if (!file.toLowerCase().endsWith('.txt')) continue;
      if (existingFiles.has(file)) continue;
      const content = await fs.readFile(filePath, 'utf-8');
      const slug = file.replace(/\.txt$/i, '');
      const { type, code } = parseKararInfo(slug, content);
      const summaryEntry = summariesDataMap.get(slug) || {};
      await prisma.karar.create({
        data: {
          fileName: file,
          content,
          type,
          code,
          aiSummary: summaryEntry.summary || null,
          keywords: summaryEntry.keywords || null,
          contentLength: content.length,
        },
      });
      added++;
    }
    console.log(`✅ ${added} yeni karar eklendi.`);
  } catch (error) {
    console.error('Karar eklenirken hata oluştu:', error);
  }
}

async function main() {
  console.log("Veritabanı seed işlemi başlıyor...");
  await seedMevzuat();
  await seedKararlar();
  console.log("🚀 Seed tamamlandı!");
}

main()
  .catch(e => {
    console.error("Beklenmedik hata:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("DB bağlantısı kesildi.");
  });