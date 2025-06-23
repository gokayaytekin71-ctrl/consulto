import fs from 'fs/promises';
import path from 'path';

function generateNameFromKey(key) {
  return key.replace(/\.json$/i, '').replace(/^\d+_/, '').replace(/_/g, ' ');
}

/**
 * Mevzuat klasörünü okur ve { key: name } şeklinde bir Map nesnesi döndürür.
 * Bu fonksiyon sadece sunucu tarafında çalışır.
 * @returns {Promise<Map<string, string>>}
 */
export async function getStatuteNameMap() {
  const statutesDirectory = path.join(process.cwd(), 'veri/mevzuat');
  const nameMap = new Map();

  try {
    const filenames = await fs.readdir(statutesDirectory);
    for (const filename of filenames) {
      if (path.extname(filename).toLowerCase() === '.json') {
        const key = filename.replace(/\.json$/, '');
        const name = generateNameFromKey(key);
        nameMap.set(key, name);
      }
    }
  } catch (error) {
    console.error("Mevzuat adları okunurken hata:", error);
  }
  return nameMap;
}