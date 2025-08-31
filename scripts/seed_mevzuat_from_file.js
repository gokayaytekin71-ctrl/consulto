#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Seed Mevzuat & MevzuatMadde from parsed JSON files. (ESM sürüm)
 *
 * Beklenen JSON şeması (örnek):
 * {
 *   "mevzuat_adi": "Kamu İhale Sözleşmeleri Kanunu",
 *   "mevzuat_numarasi": 4735,
 *   "kanun_icerigi": {
 *     "BİRİNCİ BÖLÜM": {
 *       "baslik": "Fiyat Farkı, Sigorta, ...",
 *       "maddeler": {
 *         "1": {"baslik":"Amaç","metin":"..."},
 *         "2": {"baslik":"Kapsam","metin":"..."}
 *       }
 *     },
 *     "...": { ... }
 *   }
 * }
 *
 * Kullanım:
 *   node scripts/seed_mevzuat_from_file.js <klasor_yolu>
 *
 * Notlar:
 * - Her dosya için Mevzuat kaydı `key = kanun-<numara>` (numara yoksa dosya adı) ile UPSERT edilir.
 * - Varsa mevcut MevzuatMadde kayıtları silinir, dosyadaki maddeler sıralı şekilde yeniden eklenir.
 * - `slug` Türkçe karakterlerden arındırılarak üretilir.
 * - `maddeNoOrder` sadece tamamen sayısal madde numaralarında doldurulur.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ───────────── Yardımcılar ─────────────

function readJson(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function normalizeTR(str) {
  return (str || '')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c');
}

function slugify(str) {
  return normalizeTR(String(str || ''))
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // aksanlar
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

function cleanMaddeText(text) {
  if (!text) return '';

  const lines = String(text).split(/\r?\n/);

  const isAllCaps = (s) =>
    s && s === s.toUpperCase() && /[A-ZÇĞİÖŞÜ]/.test(s) && !/[a-zçğıöşü]/.test(s);

  const isBlockHeader = (s) =>
    isAllCaps(s) && /(KİTAP|KISIM|BÖLÜM|AYIRIM|HUKUKU|BAŞLANGIÇ)/.test(s);

  const isUpperAlphaHead = (s) => /^[A-ZÇĞİÖŞÜ]\.\s+/.test(s); // "A. ..."
  const isRomanHead = (s) => /^(?:[IVXLCDM]+)\.\s+/.test(s);   // "I. ..."

  const out = [];
  for (const ln of lines) {
    const s = ln.trim();

    // Tam satır başlıklarını at
    if (!s) { out.push(ln); continue; }
    if (isBlockHeader(s)) continue;
    if (isUpperAlphaHead(s)) continue;
    if (isRomanHead(s)) continue;

    out.push(ln);
  }

  // Fazla boşlukları sadeleştir
  let joined = out.join('\n');
  joined = joined.replace(/[ \t]+$/gm, '');
  joined = joined.replace(/\n{3,}/g, '\n\n');
  return joined.trim();
}

function parseMaddeNoOrder(maddeNo) {
  if (!maddeNo) return null;
  const m = String(maddeNo).match(/^\s*(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function flattenArticles(kanunIcerigi) {
  // Sıra korunarak tüm bölümlerden maddeleri tek diziye indir.
  const result = [];
  let orderIndex = 1;
  const seen = new Set();

  // Yardımcı: tek sözlükten "no->(baslik,metin)" çiftlerini sırayla ekle
  const pushFromDict = (dict, ctx, tip) => {
    if (!dict) return;

    let prefix = "";
    if (tip === "gecici") prefix = "GEÇİCİ ";
    else if (tip === "ek") prefix = "EK ";

    for (const no of Object.keys(dict)) {
      const maddeNoStr = prefix + String(no);
      if (seen.has(maddeNoStr)) {
        console.warn(`⚠️  Yineleyen madde numarası atlandı: ${maddeNoStr}`);
        continue;
      }
      seen.add(maddeNoStr);

      const item = dict[no] || {};
      const baslik = (item.baslik || '').trim();
      const metin = cleanMaddeText(item.metin || '');

      result.push({
        maddeNo: maddeNoStr,
        maddeNoOrder: parseMaddeNoOrder(maddeNoStr),
        maddeBaslik: baslik || null,
        maddeUstBaslik: null, // Üst başlık istenmiyor
        kisim: /KISIM/.test(ctx.sectionKey) ? ctx.sectionKey : null,
        bolum: /BÖLÜM/.test(ctx.sectionKey) ? ctx.sectionKey : null,
        ayrim: /AYIRIM/.test(ctx.sectionKey) ? ctx.sectionKey : null,
        maddeMetin: metin,
        orderIndex: orderIndex++,
      });
    }
  };

  for (const sectionKey of Object.keys(kanunIcerigi || {})) {
    const section = kanunIcerigi[sectionKey] || {};
    // Öncelik: normal maddeler
    pushFromDict(section.maddeler, { sectionKey }, "normal");
    // Opsiyonel: geçici ve ek maddeler de varsa ekle
    pushFromDict(section.gecici_maddeler, { sectionKey }, "gecici");
    pushFromDict(section.ek_maddeler, { sectionKey }, "ek");
  }

  return result;
}

async function upsertMevzuatFromFile(filePath) {
  const data = readJson(filePath);

  const name = data.mevzuat_adi || path.basename(filePath, '.json');
  const number = data.mevzuat_numarasi || null;
  const slug = slugify(name);
  const key = number ? `kanun-${number}` : `file-${slug}`;

  const contentStr = JSON.stringify(data);

  const articles = flattenArticles(data.kanun_icerigi || {});

  // Deduplicate articles again as safeguard
  const uniqueArticles = [];
  const seen2 = new Set();
  for (const a of articles) {
    if (seen2.has(a.maddeNo)) {
      console.warn(`⚠️  Yineleyen madde numarası atlandı (upsert safhası): ${a.maddeNo}`);
      continue;
    }
    seen2.add(a.maddeNo);
    uniqueArticles.push(a);
  }

  const articleCount = uniqueArticles.length;

  // Mevzuat KAYIT çözümlemesi: önce mevcut kaydı key veya slug ile bul
  let existing = await prisma.mevzuat.findFirst({
    where: {
      OR: [{ key }, { slug }],
    },
    select: { id: true, key: true },
  });

  // Eğer numara yokken (file-<slug>) oluşturulmuş eski bir kayıt varsa
  // ve şimdi numaralı key hesaplandıysa, yine de var olan kaydı güncelle.
  if (!existing && number) {
    const altKey = `file-${slug}`;
    existing = await prisma.mevzuat.findUnique({
      where: { key: altKey },
      select: { id: true, key: true },
    });
  }

  let targetId;
  if (existing) {
    // Güncelleme
    targetId = existing.id;
    await prisma.mevzuat.update({
      where: { id: targetId },
      data: {
        // key'i sabit tutuyoruz; slug çakışmalarını önlemek için mevcut kaydı kullan
        name,
        content: contentStr,
        slug,
        articleCount,
        updatedAt: new Date(),
      },
    });
  } else {
    // Yeni oluştur
    targetId = key; // deterministik id
    await prisma.mevzuat.create({
      data: {
        id: targetId,
        key,
        name,
        content: contentStr,
        slug,
        shortName: null,
        year: null,
        articleCount,
      },
    });
  }

  // Eski maddeleri sil → yenilerini ekle
  await prisma.mevzuatMadde.deleteMany({ where: { mevzuatId: targetId } });

  if (uniqueArticles.length) {
    await prisma.mevzuatMadde.createMany({
      data: uniqueArticles.map((a) => ({
        mevzuatId: targetId,
        maddeNo: a.maddeNo,
        maddeNoOrder: a.maddeNoOrder,
        maddeBaslik: a.maddeBaslik,
        maddeUstBaslik: a.maddeUstBaslik,
        kisim: a.kisim,
        bolum: a.bolum,
        ayrim: a.ayrim,
        maddeMetin: a.maddeMetin,
        orderIndex: a.orderIndex,
      })),
    });
  }

  console.log(`✓ ${name} (${articleCount} madde) — slug: ${slug}`);
}

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Kullanım: node scripts/seed_mevzuat_from_file.js <json_klasoru>');
    process.exit(1);
  }

  const abs = path.resolve(dir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    console.error(`Hata: '${abs}' bir klasör değil veya yok.`);
    process.exit(1);
  }

  const files = fs.readdirSync(abs)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(abs, f));

  if (!files.length) {
    console.error('Klasörde .json dosyası bulunamadı.');
    process.exit(1);
  }

  try {
    for (const fp of files) {
      await upsertMevzuatFromFile(fp);
    }
  } catch (err) {
    console.error('✗ Hata:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// ESM'de "main" kontrolü:
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  // Doğrudan çalıştırıldı
  // eslint-disable-next-line unicorn/prefer-top-level-await
  main();
}
