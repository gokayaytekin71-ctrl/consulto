// app/makaleler/page.js
import Link from "next/link";
import prisma from "@/lib/prisma";
import MakaleListClient from "@/components/MakaleListClient";

export const dynamic = "force-dynamic";

export default async function MakalelerPage({ searchParams }) {
  const { page: pageStr, search = "" } = searchParams;
  const page = Math.max(1, parseInt(pageStr) || 1);
  const take = 15;
  const skip = (page - 1) * take;

  // Toplamı ve sayfayı beraber çek
  const [totalCount, makaleler] = await Promise.all([
    prisma.makale.count({
      where: { baslik: { contains: search, mode: "insensitive" } },
    }),
    prisma.makale.findMany({
      where: { baslik: { contains: search, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / take);

  // Favori DOI'ler
  const favRecords = await prisma.favoriteMakale.findMany({
    where: { /* userId ile filtreleyin */ },
    include: { makale: true },
  });
  const favDois = favRecords.map((f) => f.makale.doi);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b3d59] via-[#103e5a] to-[#012641] text-white px-10 py-16">
      <h1 className="text-4xl font-extrabold tracking-tight text-center mb-6 drop-shadow-lg">
        Makaleler
      </h1>

      {/* Arama Kutusu */}
      <form
        method="get"
        className="max-w-7xl mx-auto flex items-center mb-8"
      >
        <input
          name="search"
          type="text"
          defaultValue={search}
          placeholder="Makale başlığında ara..."
          className="flex-1 px-4 py-2 rounded-l-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-r-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition"
        >
          Ara
        </button>
      </form>

      {/* Liste */}
      <div className="backdrop-blur-md bg-white/20 rounded-lg shadow-2xl p-6 ring-1 ring-slate-700 max-w-7xl mx-auto animate-fade-in">
        <MakaleListClient
          initialMakaleler={makaleler}
          initialFavDois={favDois}
        />
      </div>

      {/* Sayfalama */}
      <div className="flex justify-center items-center space-x-4 mt-8 text-white">
        {page > 1 ? (
          <Link
            href={`?page=${page - 1}&search=${encodeURIComponent(search)}`}
            className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 transition"
          >
            ‹ Önceki
          </Link>
        ) : (
          <span className="px-3 py-1 text-gray-400">‹ Önceki</span>
        )}

        <span>
          {page} / {totalPages}
        </span>

        {page < totalPages ? (
          <Link
            href={`?page=${page + 1}&search=${encodeURIComponent(search)}`}
            className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 transition"
          >
            Sonraki ›
          </Link>
        ) : (
          <span className="px-3 py-1 text-gray-400">Sonraki ›</span>
        )}
      </div>
    </div>
  );
}