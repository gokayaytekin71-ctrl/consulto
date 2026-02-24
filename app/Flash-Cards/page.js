import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import FlashcardsUI from './FlashCardsUI';

export default async function FlashcardsPage() {
  const flashcardsData = {};
  // Proje kök dizininden data/flashcards yolunu belirle
  const baseDir = path.join(process.cwd(), 'data', 'flashcards');

  // data/flashcards klasörü var mı kontrol et
  if (fs.existsSync(baseDir)) {
    // 1. Aşama: Üst klasörleri (Ana Kategorileri) bul (Örn: Gayrimenkul Hukuku)
    const mainCategories = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const mainCat of mainCategories) {
      flashcardsData[mainCat] = {};
      const mainCatPath = path.join(baseDir, mainCat);
      
      // 2. Aşama: Klasör içindeki CSV dosyalarını (Alt Kategorileri) bul
      const files = fs.readdirSync(mainCatPath).filter(file => file.endsWith('.csv'));

      for (const file of files) {
        // Dosya adından .csv uzantısını sil, baş harfleri büyüt ve tireleri boşlukla değiştir
        const subCatName = file
          .replace('.csv', '')
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        const filePath = path.join(mainCatPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // 3. Aşama: CSV'yi parse et
        const parsed = Papa.parse(fileContent, { skipEmptyLines: true });
        const parsedData = parsed.data
          .filter(row => row.length >= 2 && row[0] && row[1])
          .map((row, index) => ({
            id: index,
            question: row[0],
            answer: row[1],
          }));

        // Veriyi ağaca ekle
        flashcardsData[mainCat][subCatName] = parsedData;
      }
    }
  }

  return (
    // Arka plan rengini daha temiz bir gri tonuyla değiştirdik
    <main className="min-h-screen bg-[#F8FAFC] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Hukuki Bilgi Kartları
          </h1>
          <p className="text-slate-500 text-lg">
            Consulto Hukuk Pratik Çalışma ve İçtihat Modülü
          </p>
        </div>
        
        {/* Tüm dinamik veri UI bileşenine aktarılıyor */}
        <FlashcardsUI data={flashcardsData} />
      </div>
    </main>
  );
}