// scripts/weaviate-setup.js
import weaviate from 'weaviate-ts-client';
import 'dotenv/config';

async function setup() {
  const client = weaviate.client({
    scheme: 'http',
    host: process.env.WEAVIATE_HOST, // örn. "localhost:8080"
  });

  // (İsterseniz eski schema’yı silin)
  try {
    await client.schema.classDeleter().withClassName('Karar').do();
  } catch {}

  // Yeni Karar sınıfını oluştur
  await client.schema.classCreator()
    .withClass({
      class: 'Karar',
      vectorizer: 'text2vec-transformers',   // contextionary veya transformers
      properties: [
        { name: 'fileName',     dataType: ['string'] },
        { name: 'type',         dataType: ['string'] },
        { name: 'code',         dataType: ['string'] },
        { name: 'content',      dataType: ['text'] },
        { name: 'aiSummary',    dataType: ['text'] },
        { name: 'keywords',     dataType: ['string[]'] },
        { name: 'contentLength',dataType: ['int'] },
      ],
    })
    .do();

  console.log('✅ Weaviate schema hazır.');
}

setup().catch(err => {
  console.error('Weaviate setup hatası:', err);
  process.exit(1);
});