/* scripts/import-ibbgk-txt.js
 * Klasördeki .txt dosyalarını:
 *  - public."Karar" tablosuna (content, fileName, code, type...)
 *  - public.ibbgk tablosuna (karar_id FK) ekler.
 *
 * Çalıştırma:
 *   node scripts/import-ibbgk-txt.js ./data/ibbgk
 */

import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function baseNameNoExt(file) {
  return file.replace(/\.txt$/i, "");
}

// Dosya adından E/K bilgisi ve “type” çıkar
function parseMetaFromFilename(fileName) {
  const base = baseNameNoExt(fileName);

  // Ör: Hukuk_Genel_Kurulu_2017-2345E_2020-739K
  const m = base.match(/_(\d{4})-([0-9A-Za-z()/-]+)E_(\d{4})-([0-9A-Za-z()/-]+)K$/i);
  let code = "";
  if (m) {
    const ePart = String(m[2]).replace(/\s*-\s*/g, "/");
    const kPart = String(m[4]).replace(/\s*-\s*/g, "/");
    code = `${ePart} E. ${kPart} K.`;
  }

  let type = "İçtihadı Birleştirme";
  if (/Ceza_Genel_Kurulu/i.test(base)) type = "Ceza Genel Kurulu – İçtihadı Birleştirme";
  if (/Hukuk_Genel_Kurulu/i.test(base)) type = "Hukuk Genel Kurulu – İçtihadı Birleştirme";
  if (/İBK|IBK|İçtihad[iı]_?Birleştirme/i.test(base)) type = "İBK";

  return { base, code, type };
}

async function ensureTsVector(id) {
  // Projende trigger varsa gerekmez; yoksa aşağıdaki satırı yorumdan çıkar.
  // await prisma.$executeRawUnsafe(
  //   `UPDATE public."Karar" SET tsv_main = to_tsvector('turkish', coalesce(content,'')) WHERE id = $1`,
  //   id
  // );
}

async function importDir(dir) {
  const entries = await fs.readdir(dir);
  const txtFiles = entries.filter((f) => /\.txt$/i.test(f));

  console.log(`Bulunan TXT dosyası: ${txtFiles.length}`);

  for (const fileName of txtFiles) {
    const full = path.join(dir, fileName);
    const content = await fs.readFile(full, "utf8");
    const contentLength = Buffer.byteLength(content, "utf8");

    const { base, code, type } = parseMetaFromFilename(fileName);

    // Karar.id için pratik: dosya adının uzantısız hali (slug)
    const id = base;

    // 1) Karar (upsert)
    const karar = await prisma.karar.upsert({
      where: { id }, // id TEXT primary key varsayımı
      update: {
        fileName,
        content,
        type,
        code,
        contentLength,
        // aiSummary, keywords istersen boş geç
      },
      create: {
        id,
        fileName,
        content,
        type,
        code,
        contentLength,
      },
      select: { id: true },
    });

    await ensureTsVector(karar.id);

    // 2) ibbgk: varsa atla, yoksa oluştur
    const exists = await prisma.ibbgk.findFirst({
      where: { karar_id: karar.id },
      select: { id: true },
    });

    if (!exists) {
      await prisma.ibbgk.create({
        data: {
          karar_id: karar.id,
          // birlesme_no, konu, ozet, etiketler -> istersen daha sonra doldur
          // etiketler: { kaynak: "import" }  // jsonb örnek
        },
      });
    }

    console.log(`✓ eklendi: ${fileName}  -> karar_id=${karar.id}`);
  }
}

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Kullanım: node scripts/import-ibbgk-txt.js <klasör-yolu>");
    process.exit(1);
  }
  const abs = path.resolve(dir);
  await importDir(abs);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });