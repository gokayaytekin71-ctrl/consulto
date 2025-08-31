// scripts/rebuild-type-code.js
// Sadece "karar" tablosunda type ve code'u yeniden oluşturur.
// Kullanım:
//   node scripts/rebuild-type-code.js
//   node scripts/rebuild-type-code.js --force
//   node scripts/rebuild-type-code.js --karar-dir=./veri/kararlar

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const CWD = process.cwd();

function argVal(name, def) {
  const hit = args.find(a => a.startsWith(`${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : def;
}

const KARAR_DIR = path.resolve(argVal('--karar-dir', path.join(CWD, 'veri/kararlar')));

async function getAllFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? getAllFiles(p) : p;
  }));
  return files.flat();
}

// ── Yardımcılar ───────────────────────────────────────────────────────────────
function normalizeDaireAdi(name) {
  if (!name) return null;
  let t = String(name).trim();
  t = t.replace(/^Yargıtay\s+/i, '').trim();
  t = t.replace(/\s*DAİRESİ$/i, ' Dairesi').replace(/\s*DAIRESI$/i, ' Dairesi');
  t = t.replace(/^(\d+)\s+(Hukuk Dairesi|Ceza Dairesi)/i, '$1. $2');
  if (/Hukuk\s+Genel\s+Kurulu|HGK/i.test(t)) return 'Hukuk Genel Kurulu';
  if (/Ceza\s+Genel\s+Kurulu|CGK|YCGK/i.test(t)) return 'Ceza Genel Kurulu';
  return t || null;
}

function normalizePart(s) {
  // "2012 / 20-877" -> "2012/20-877" ; "2012-15976" -> "2012/15976"
  return String(s)
    .replace(/\s*\/\s*/g, '/')
    .replace(/\b(\d{4})\s*-\s*([0-9A-Za-z()\-\/]+)\b/g, '$1/$2')
    .replace(/\s+/g, ' ')
    .trim();
}

// İçerikten oku (ilk 10 satır, toleranslı) — fallback: Genel Kurul + X. Hukuk/Ceza Dairesi, E./Esas(No), K./Karar(No), '-' veya '/' ayracı
function parseFromContentFirstLines(text) {
  if (!text) return null;

  // İlk 10 satırı tara; uzun tireleri normalize et
  const first10 = text
    .split(/\r?\n/)
    .slice(0, 10)
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')  // uzun tireleri normalize et
    .trim();

  // Type (Yargıtay opsiyonel): "Hukuk Genel Kurulu" | "Ceza Genel Kurulu" | "\d+. Hukuk Dairesi" | "\d+. Ceza Dairesi"
  const typeRe = new RegExp(
    '(?:Yargıtay\\s+)?' +
    '(' +
      'Hukuk\\s+Genel\\s+Kurulu' + '|' +
      'Ceza\\s+Genel\\s+Kurulu'  + '|' +
      '\\d+\\s*\\.?\\s*Hukuk\\s*Dairesi' + '|' +
      '\\d+\\s*\\.?\\s*Ceza\\s*Dairesi' +
    ')',
    'i'
  );
  const typeMatch = first10.match(typeRe);
  if (!typeMatch) return null;

  // Esas / Karar: "2019/1234" veya "2019-1234" + (E.|Esas[ No]) , (K.|Karar[ No])
  const eRe = /(\d{4}\s*[-/]\s*[0-9A-Za-z()\/\-]+)\s*(E\.?|Esas(?:\s*No)?\.?)/i;
  const kRe = /(\d{4}\s*[-/]\s*[0-9A-Za-z()\/\-]+)\s*(K\.?|Karar(?:\s*No)?\.?)/i;

  const eMatch = first10.match(eRe);
  const kMatch = first10.match(kRe);
  if (!eMatch || !kMatch) return null;

  const rawType = typeMatch[0];
  const type = normalizeDaireAdi(rawType);
  const ePart = normalizePart(eMatch[1]);  // 2019-1234 -> 2019/1234
  const kPart = normalizePart(kMatch[1]);  // 2020-5678 -> 2020/5678
  const code  = `${ePart} E. ${kPart} K.`;

  return (type && code) ? { type, code } : null;
}

// <no>_Hukuk_Dairesi_YYYY-...E_YYYY-...K.txt
function parseFromDaireFilename(fileName) {
  const base = fileName.replace(/\.txt$/i, '');
  const m = base.match(/^(\d+)_((?:Hukuk|Ceza))_Dairesi_(\d{4}-[0-9A-Za-z\-\/()]+)E_(\d{4}-[0-9A-Za-z\-\/()]+)K$/i);
  if (!m) return null;
  const daireNo = m[1];
  const tur = /Hukuk/i.test(m[2]) ? 'Hukuk' : 'Ceza';
  const ePart = normalizePart(m[3]);
  const kPart = normalizePart(m[4]);
  return { type: `${daireNo}. ${tur} Dairesi`, code: `${ePart} E. ${kPart} K.` };
}

// Hukuk_Genel_Kurulu_YYYY-...E_YYYY-...K.txt  /  Ceza_Genel_Kurulu_...
function parseFromKurulFilename(fileName) {
  const base = fileName.replace(/\.txt$/i, '');
  const m = base.match(/^((?:Hukuk|Ceza))_Genel_Kurulu_(\d{4}-[0-9A-Za-z\-\/()]+)E_(\d{4}-[0-9A-Za-z\-\/()]+)K$/i);
  if (!m) return null;
  const kurul = /Hukuk/i.test(m[1]) ? 'Hukuk Genel Kurulu' : 'Ceza Genel Kurulu';
  const ePart = normalizePart(m[2]);
  const kPart = normalizePart(m[3]);
  return { type: kurul, code: `${ePart} E. ${kPart} K.` };
}

async function main() {
  console.log(`▶ Rebuild type+code | karar-dir=${KARAR_DIR} | mode=${FORCE ? 'FORCE (tüm satırlar)' : 'ONLY NULLs'}`);

  const allFiles = (await getAllFiles(KARAR_DIR)).filter(f => f.toLowerCase().endsWith('.txt'));
  const fileSet = new Set(allFiles.map(f => path.basename(f)));

  // Hedef kayıtlar (DB’den)
  const targets = FORCE
    ? await prisma.karar.findMany({ select: { fileName: true } })
    : await prisma.karar.findMany({
        where: { OR: [{ type: null }, { code: null }] },
        select: { fileName: true }
      });

  let updated = 0, skipped = 0, missingFile = 0;

  for (const row of targets) {
    const fileName = row.fileName;
    if (!fileSet.has(fileName)) { missingFile++; continue; }
    const fp = allFiles.find(f => path.basename(f) === fileName);

    let parsed = null;
    try {
      // 1) Dosya adından çıkar (yapısal adlar)
      parsed = parseFromDaireFilename(fileName) || parseFromKurulFilename(fileName);
      // 2) Olmazsa içerikten çıkar (karar_* dahil tüm dosyalar için)
      if (!parsed) {
        const text = await fs.readFile(fp, 'utf-8');
        parsed = parseFromContentFirstLines(text);
      }
    } catch { /* atla */ }

    if (!parsed) { skipped++; continue; }

    // type'ı normalize et (Yargıtay öneki eklemiyoruz; UI'da eklemek kolay)
    const data = {
      type: normalizeDaireAdi(parsed.type),
      code: parsed.code
    };

    await prisma.karar.update({ where: { fileName }, data });
    updated++;
  }

  console.log(`✅ Bitti. Güncellendi: ${updated}, Atlandı: ${skipped}, Dosyası bulunmayan: ${missingFile}`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ Hata:', e);
  prisma.$disconnect();
  process.exit(1);
});