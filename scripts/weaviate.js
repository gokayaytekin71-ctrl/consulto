// scripts/embed.js

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WEAVIATE_URL = process.env.NEXT_PUBLIC_WEAVIATE_URL;
if (!WEAVIATE_URL) {
  console.error('❌ .env.local içinde NEXT_PUBLIC_WEAVIATE_URL tanımlı değil!');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.karar.count();
  if (total === 0) {
    console.log('⚠️  Veritabanında hiç karar yok.');
    return;
  }
  console.log(`📊 ${total.toLocaleString()} karar veritabanında mevcut.\n`);

  // Mevcut embed’leri Weaviate’den çek
  console.log("⏳ Weaviate'den mevcut embed’leri çekiliyor…");
  const gqlQuery = JSON.stringify({
    query: `{
      Get {
        Karar {
          fileName
        }
      }
    }`
  });
  const gqlRes = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: gqlQuery
  });
  const gqlJson = await gqlRes.json();
  const existing = new Set(gqlJson.data.Get.Karar.map(k => k.fileName));

  const DB_BATCH = 1000;
  const W_BATCH  = 50;
  let pulled   = 0;
  let embedded = 0;

  while (pulled < total) {
    // 1) DB'den çek
    const slice = await prisma.karar.findMany({
      skip: pulled,
      take: DB_BATCH,
      select: { fileName: true, content: true }
    });
    // Henüz embed edilmemiş kararları seç
    const newSlice = slice.filter(({ fileName }) => !existing.has(fileName));

    pulled += slice.length;
    process.stdout.write(
      `⏳ Çekiliyor: ${pulled.toLocaleString()}/${total.toLocaleString()}\r`
    );

    // 2) Weaviate'e yolla (alt batch'lerle)
    for (let i = 0; i < newSlice.length; i += W_BATCH) {
      const batch = newSlice.slice(i, i + W_BATCH);
      const objs = batch.map(({ fileName, content }) => ({
        class: 'Karar',
        properties: { fileName, content }
      }));

      const res = await fetch(
        `${WEAVIATE_URL}/v1/batch/objects`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ objects: objs })
        }
      );
      if (!res.ok) {
        console.error(
          `\n❌ Weaviate hata (embed count ${embedded}):`,
          await res.text()
        );
        process.exit(1);
      }

      embedded += batch.length;
      process.stdout.write(
        `✅ Embed ediliyor: ${embedded.toLocaleString()}/${total.toLocaleString()}\r`
      );
    }
  }

  console.log('\n\n🎉 Tüm kararlar Weaviate’e yüklendi ve embed edildi.');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ Hata:', e);
  process.exit(1);
});