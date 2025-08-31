import { spawnSync } from 'child_process';
import path from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Weaviate connection settings
const WEAVIATE_URL = process.env.WEAVIATE_HOST;
if (!WEAVIATE_URL) {
  console.error('❌ .env.local içinde WEAVIATE_HOST tanımlı değil!');
  process.exit(1);
}

// Weaviate class configuration
const WEAVIATE_CLASS_NAME = 'HukukBelgesi';
const WEAVIATE_UPLOAD_BATCH_SIZE = 20; // smaller batch to avoid EPIPE

/**
 * Upload a batch of objects to Weaviate with retries on EPIPE.
 */
async function uploadBatch(batch) {
  const url = `${WEAVIATE_URL}/v1/batch/objects`;
  const body = JSON.stringify({ objects: batch });
  const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body };
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Weaviate responded ${res.status}: ${text}`);
      }
      return;
    } catch (err) {
      // Retry on transient network errors
      const isTransient = [ 'EPIPE', 'ECONNRESET' ].includes(err.code) 
                        || err.message.includes('EPIPE') 
                        || err.message.includes('socket hang up');
      if (isTransient && attempt < 3) {
        console.warn(`⚠️ Network error (${err.code || err.message}), retry ${attempt}/3 after 2s...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      console.error('❌ Batch upload failed:', err);
      throw err;
    }
  }
}

// Global set of existing IDs in Weaviate
let existingIds = new Set();
  
// Global text splitter for chunking
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1500, chunkOverlap: 200 });
// If you defined these parsers and file-finder elsewhere in this file, omit these imports
// Recursively list .txt files in a directory and its subdirectories
function findTxtFilesRecursive(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findTxtFilesRecursive(filePath, fileList);
    } else if (filePath.toLowerCase().endsWith('.txt')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Parse an AI summary file (JSON Lines) into Weaviate objects
function parseAiOzetFile(filePath, splitter) {
  const dosyaAdi = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const satirlar = fileContent.split('\n').filter(Boolean);
  const objects = [];
  for (const satir of satirlar) {
    try {
      const veri = JSON.parse(satir);
      const { id: original_id, summary, file: related_file, uyusmazlik, "Anahtar Kelimeler": keywords } = veri;
      if (summary && original_id) {
        const formattedText = `YARGITAY KARARI ÖZETİ - ID: ${original_id}. DOSYA: ${related_file}. UYUŞMAZLIK: ${uyusmazlik || 'Belirtilmemiş'}. ANAHTAR KELIMELER: ${keywords || 'Belirtilmemiş'}. ÖZET: ${summary}`;
        const benzersiz_id_str = `ozet_${original_id}`;
        objects.push({
          class: WEAVIATE_CLASS_NAME,
          properties: {
            metin_parcasi: formattedText,
            kaynak_turu: 'ai_ozet',
            orijinal_karar_id: String(original_id),
            dosya_adi: dosyaAdi,
            benzersiz_id_str
          }
        });
      }
    } catch (_) {
      // ignore malformed lines
    }
  }
  return objects;
}

// Parse a judicial decision text file into chunked Weaviate objects
async function parseYargiKarariFile(filePath, splitter) {
  const dosyaAdi = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const metadata = {};
  const headerRegex = /^(.+?)\s+([\d\/]+\s*E\.)\s*,\s*([\d\/]+\s*K\.)/m;
  const headerMatch = fileContent.match(headerRegex);
  if (headerMatch) {
    metadata.mahkeme = headerMatch[1].trim();
    metadata.esas_no = headerMatch[2].trim();
    metadata.karar_no = headerMatch[3].trim();
  }
  const dateRegex = /(\d{2}\.\d{2}\.\d{4})\s+tarihinde/;
  const dateMatch = fileContent.match(dateRegex);
  if (dateMatch) {
    metadata.karar_tarihi = dateMatch[1];
  }
  if (!metadata.mahkeme) {
    const base = path.basename(filePath, '.txt');
    if (base.startsWith('karar_')) {
      metadata.orijinal_karar_id_fallback = base.replace('karar_', '');
    } else {
      const parts = base.split('_');
      if (parts.length >= 3) {
        metadata.karar_no = parts.pop().replace(/-/g, '/');
        metadata.esas_no = parts.pop().replace(/-/g, '/');
        metadata.mahkeme = parts.join(' ');
      }
    }
  }
  const karar_id = (metadata.mahkeme && metadata.esas_no)
    ? `${metadata.mahkeme} ${metadata.esas_no}`
    : (metadata.orijinal_karar_id_fallback || dosyaAdi);
  const chunks = splitter.splitText(fileContent);
  const objects = [];
  for (let i = 0; i < chunks.length; i++) {
    const formattedText = `YARGI KARARI - ID: ${karar_id}. MAHKEME: ${metadata.mahkeme || 'N/A'}. ESAS NO: ${metadata.esas_no || 'N/A'}. KARAR NO: ${metadata.karar_no || 'N/A'}. BÖLÜM ${i+1}/${chunks.length}. İÇERİK: ${chunks[i]}`;
    const benzersiz_id_str = `karar_${String(karar_id).replace(/[\s\/]/g,'_')}_p${i}`;
    objects.push({
      class: WEAVIATE_CLASS_NAME,
      properties: {
        metin_parcasi: formattedText,
        kaynak_turu: 'yargi_karari',
        dosya_adi: dosyaAdi,
        benzersiz_id_str,
        orijinal_karar_id: karar_id,
        karar_tarihi: metadata.karar_tarihi || null,
        mahkeme: metadata.mahkeme || null,
        esas_no: metadata.esas_no || null,
        karar_no: metadata.karar_no || null
      }
    });
  }
  return objects;
}

const processAndUpload = async (filePaths, parserFn, typeName) => {
    if (filePaths.length === 0) return;
    console.log(`\n--- ${typeName} İşleniyor (${filePaths.length} dosya) ---`);

    /**
     * Call Python script to batch-embed an array of texts via stdin/stdout.
     * Expects a Python script at ./scripts/embed_batch.py
     * More robust error handling and buffer.
     */
    function embedBatchWithPython(texts) {
      const jsonInput = JSON.stringify(texts);
      const proc = spawnSync('python3', ['scripts/embed_batch.py'], {
        input: jsonInput,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10 // 10 MiB buffer for large outputs
      });
      if (proc.error) {
        console.error('❌ Python process error:', proc.error);
        throw proc.error;
      }
      if (proc.status !== 0) {
        console.error(`❌ Python embedding script exited with code ${proc.status}`);
        console.error(proc.stderr);
        return [];
      }
      const stdout = proc.stdout && proc.stdout.trim();
      if (!stdout) {
        console.warn('⚠️ Python embedding returned empty stdout');
        return [];
      }
      try {
        return JSON.parse(stdout);
      } catch (e) {
        console.error('❌ Python embedding output parsing failed. Raw output:', stdout);
        throw e;
      }
    }

    // 1) Per-file parsing with skip detection
    let allNew = [];
    for (let idx = 0; idx < filePaths.length; idx++) {
        const filePath = filePaths[idx];
        const parsed = await parserFn(filePath, splitter);
        const newObjs = parsed.filter(obj => !existingIds.has(obj.properties.benzersiz_id_str));
        if (newObjs.length === 0) {
            console.log(`⏭️ [${typeName}] ${idx+1}/${filePaths.length} ${path.basename(filePath)}: atlandı (yeni obje yok)`);
        } else {
            console.log(`✅ [${typeName}] ${idx+1}/${filePaths.length} ${path.basename(filePath)}: ${newObjs.length} yeni obje`);
            allNew.push(...newObjs);
        }
    }
    console.log(`🔍 ${typeName}: toplam ${allNew.length.toLocaleString()} yeni obje bulundu.`);
    if (allNew.length === 0) return;

    // 2) Batch embedding and upload
    const embedBatchSize = 15;  // Python kodundaki gibi
    const uploadBatchSize = WEAVIATE_UPLOAD_BATCH_SIZE;
    let uploadBuffer = [];

    for (let i = 0; i < allNew.length; i += embedBatchSize) {
        const slice = allNew.slice(i, i + embedBatchSize);
        const texts = slice.map(o => o.properties.metin_parcasi);
        // Batch embed via Python
        const outputs = embedBatchWithPython(texts);
        outputs.forEach((output, idx) => {
            slice[idx].vector = Array.from(output);
            uploadBuffer.push(slice[idx]);
        });
        // If enough objects, upload in weaviate batches
        while (uploadBuffer.length >= uploadBatchSize) {
            const batch = uploadBuffer.splice(0, uploadBatchSize);
            // retry-capable upload
            await uploadBatch(batch);
        }
        process.stdout.write(`⏳ ${typeName} embedding: ${Math.min(i + embedBatchSize, allNew.length)}/${allNew.length}\r`);
    }
    // Flush remaining uploads
    if (uploadBuffer.length > 0) {
        await uploadBatch(uploadBuffer);
    }
    console.log(`\n✅ ${typeName} tamamlandı. Toplam yüklendi: ${allNew.length.toLocaleString()}`);
};

// --- Entry point ---
async function main() {
  // Weaviate'ten mevcut objelerin benzersiz_id_str alanlarını GraphQL ile çek ve existingIds set'ine ekle
  console.log("⏳ Weaviate'ten mevcut ID’ler alınıyor...");
  let lastId = null;
  while (true) {
    const gqlQuery = {
      query: `{ Get { ${WEAVIATE_CLASS_NAME}(limit: 5000${lastId ? `, after: \"${lastId}\"` : ''}) { benzersiz_id_str _additional { id } } } }`
    };
    const gqlRes = await fetch(
      `${WEAVIATE_URL}/v1/graphql`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gqlQuery)
      }
    );
    const gqlJson = await gqlRes.json();
    const arr = gqlJson.data?.Get?.[WEAVIATE_CLASS_NAME];
    if (!arr || arr.length === 0) break;
    arr.forEach(item => existingIds.add(item.benzersiz_id_str));
    lastId = arr[arr.length - 1]._additional.id;
    process.stdout.write(`✅ ${existingIds.size.toLocaleString()} adet mevcut obje okundu...\r`);
  }
  console.log(`\n✅ Weaviate'te toplam ${existingIds.size.toLocaleString()} adet mevcut obje bulundu.`);

  // Gather files
  const AI_OZETLER_PATH = path.resolve(process.cwd(), 'veri', 'summaries');
  const YARGI_KARARLARI_PATH = path.resolve(process.cwd(), 'veri', 'kararlar');
  const aiOzetFiles = fs.existsSync(AI_OZETLER_PATH)
    ? findTxtFilesRecursive(AI_OZETLER_PATH)
    : [];
  const yargiKarariFiles = fs.existsSync(YARGI_KARARLARI_PATH)
    ? findTxtFilesRecursive(YARGI_KARARLARI_PATH)
    : [];

  console.log('🔰 Script başladı');
  await processAndUpload(aiOzetFiles, parseAiOzetFile, 'AI Özetleri');
  await processAndUpload(yargiKarariFiles, parseYargiKarariFile, 'Yargı Kararları');
  console.log('🎉 Tüm işlemler tamamlandı');
}

main().catch(err => {
  console.error('❌ Beklenmedik hata:', err);
  process.exit(1);
});
