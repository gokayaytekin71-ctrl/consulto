// Dosyanın en üstüne ekleyin (diğer importların yanına)
import prisma from '../../lib/prisma'; // VEYA projenizdeki doğru yolu belirtin

// const prisma = new PrismaClient(); satırını SİLİN veya YORUM SATIRINA ALIN.
import MevzuatListesiIstemciBileseni from './MevzuatListesiIstemciBileseni';



const populerKeys = [
  "5237_TÜRK_CEZA_KANUNU",
  "6098_TÜRK_BORÇLAR_KANUNU",
  "6100_HUKUK_MUHAKEMELERİ_KANUNU",
  "4721_TÜRK_MEDENİ_KANUNU",
  "2004_İCRA_VE_İFLAS_KANUNU",
  "4857_İŞ_KANUNU",
  "2709_TÜRKİYE_CUMHURİYETİ_ANAYASASI",
  "5271_CEZA_MUHAKEMESİ_KANUNU",
  "2577_İDARİ_YARGILAMA_USULÜ_KANUNU",
  "6502_TÜKETİCİNİN_KORUNMASI_HAKKINDA_KANUN",
  "6102_TÜRK_TİCARET_KANUNU",
];

async function getMevzuatlar(query) {
  if (query) {
    // Arama yapılıyorsa, isimde arama yap
    return prisma.mevzuat.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive', // Büyük/küçük harf duyarsız arama
        },
      },
      select: { key: true, name: true },
      orderBy: { name: 'asc' },
    });
  } else {
    // Arama yapılmıyorsa, popüler olanları getir
    return prisma.mevzuat.findMany({
      where: {
        key: {
          in: populerKeys,
        },
      },
      select: { key: true, name: true },
    });
  }
}

export default async function MevzuatListPage({ searchParams }) {
  const query = searchParams.q || '';
  const gosterilecekMevzuatlar = await getMevzuatlar(query);
  const toplamMevzuatSayisi = await prisma.mevzuat.count();
  
  const listeBasligi = query ? "Arama Sonuçları" : "Sık Kullanılan Mevzuatlar";

  return (
    <MevzuatListesiIstemciBileseni
      initialMevzuatlar={gosterilecekMevzuatlar}
      listeBasligi={listeBasligi}
      toplamMevzuatSayisi={toplamMevzuatSayisi}
      mevcutAramaSorgusu={query}
    />
  );
}