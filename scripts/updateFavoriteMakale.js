import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fetchTitleFromDOI(doi) {
  try {
    const url = `https://doi.org/${encodeURIComponent(doi)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.citationstyles.csl+json" },
      redirect: "follow",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.title || null;
  } catch (err) {
    console.error(`❌ ${doi} için başlık alınamadı:`, err.message);
    return null;
  }
}

async function main() {
  const makaleler = await prisma.makale.findMany();

  for (const makale of makaleler) {
    const yeniBaslik = await fetchTitleFromDOI(makale.doi);
    if (yeniBaslik && yeniBaslik !== makale.baslik) {
      await prisma.makale.update({
        where: { id: makale.id },
        data: { baslik: yeniBaslik },
      });
      console.log(`✔️ Güncellendi: ${makale.doi} -> ${yeniBaslik}`);
    } else {
      console.log(`ℹ️ Atlandı: ${makale.doi}`);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());