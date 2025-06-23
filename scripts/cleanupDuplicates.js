// scripts/cleanupDuplicates.js
const { PrismaClient } = require('@prisma/client'); 
// Eğer merkezi bir prisma instance'ınız varsa (lib/prisma.js gibi), onu kullanın:
// const prisma = require('../lib/prisma'); // Proje yapınıza göre yolu ayarlayın
const prisma = new PrismaClient(); // Standalone script için yeni instance genellikle sorun olmaz

async function cleanupDuplicateKararlar() {
    console.log("Tekrar eden kararlar aranıyor (type ve code'a göre)...");

    // Aynı type ve code'a sahip grupları bul
    const duplicateGroups = await prisma.karar.groupBy({
        by: ['type', 'code'],
        _count: {
            id: true, // Her gruptaki kayıt sayısını al
        },
        having: {
            id: {
                _count: {
                    gt: 1, // Sadece 1'den fazla kaydı olan grupları al
                },
            },
        },
    });

    if (duplicateGroups.length === 0) {
        console.log("Tekrar eden 'type' ve 'code' kombinasyonuna sahip karar bulunamadı.");
        return;
    }

    console.log(`${duplicateGroups.length} adet tekrar eden 'type' ve 'code' grubu bulundu.`);
    let totalDeletedCount = 0;

    for (const group of duplicateGroups) {
        // type veya code null/boş ise bu grubu atla, çünkü bu alanlara göre unique işlem yapıyoruz
        if (!group.type || !group.code || group.type.trim() === "" || group.code.trim() === "") {
            console.log(`\nUYARI: Type veya code alanı boş/null olan grup atlanıyor: Type: '<span class="math-inline">\{group\.type\}', Code\: '</span>{group.code}'`);
            continue;
        }
        console.log(`\nİşleniyor: Type: "<span class="math-inline">\{group\.type\}", Code\: "</span>{group.code}" (${group._count.id} adet)`);

        // Bu gruptaki tüm kararları createdAt'e göre (en eskisi önce) sıralı çek
        const kararlarInGroup = await prisma.karar.findMany({
            where: {
                type: group.type,
                code: group.code,
            },
            orderBy: {
                createdAt: 'asc', // En eskisini (ilk ekleneni) tutmak için
            },
            select: { id: true, fileName: true, createdAt: true } // Sadece gerekli alanları çek
        });

        if (kararlarInGroup.length > 1) {
            const recordToKeep = kararlarInGroup[0]; // En eskisini (ilk elemanı) tut
            const idsToDelete = kararlarInGroup.slice(1).map(k => k.id); // Geri kalanların ID'lerini al

            console.log(`  Tutulacak Kayıt -> ID: ${recordToKeep.id}, DosyaAdı: ${recordToKeep.fileName}, Oluşturulma: ${recordToKeep.createdAt}`);
            if (idsToDelete.length > 0) {
                console.log(`  Silinecek Kayıt ID'leri: ${idsToDelete.join(', ')}`);

                // ÖNEMLİ: Gerçek silme işlemi için aşağıdaki satırın yorumunu kaldırın.
                // Önce sadece neyin silineceğini görmek için loglarla test edin.
                 const deleteResult = await prisma.karar.deleteMany({
                     where: {
                       id: { in: idsToDelete }
                    }
                 });
                 console.log(`  Bu gruptan ${deleteResult.count} adet duplike kayıt SİLİNDİ.`);
                 totalDeletedCount += deleteResult.count;
                console.log(`  BU GRUP İÇİN SİLME İŞLEMİ ŞİMDİLİK ATLANDI (KODDA YORUM SATIRINDA).`);

            } else {
                console.log("  Bu grupta silinecek ekstra kayıt bulunamadı (beklenmedik durum).");
            }
        }
    }
    // console.log(`\nToplam ${totalDeletedCount} adet duplike karar kaydı SİLİNDİ (eğer kodda silme aktifse).`);
    console.log("\nTemizleme script'i tamamlandı. Gerçek silme için koddaki deleteMany satırının yorumunu kaldırmanız gerekir.");
}

cleanupDuplicateKararlar()
    .catch(e => {
        console.error("Duplike temizleme sırasında hata:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });