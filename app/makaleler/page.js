// app/makaleler/page.js
import Link from "next/link";
import prisma from "@/lib/prisma";
import MakaleListClient from "@/components/MakaleListClient";
import { getServerSession } from "next-auth"; // Session için gerekli
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export default async function MakalelerPage({ searchParams }) {
  const { page: pageStr, search = "" } = searchParams;
  const page = Math.max(1, parseInt(pageStr) || 1);
  const take = 12; // Grid yapısına uygun olması için 12 (3x4 veya 2x6)
  const skip = (page - 1) * take;

  // Session al (Favoriler için userId lazım)
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Veri Çekme
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

  // Favorileri Çek
  let favDois = [];
  if (userId) {
    const favRecords = await prisma.favoriteMakale.findMany({
      where: { userId },
      select: { makaleId: true },
    });
    favDois = favRecords.map((f) => f.makaleId);
  }

  return (
    // ZEMİN: Yumuşak Koyu Tema (Slate-900)
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* --- BACKGROUND FX --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            Akademik Arşiv
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-xl">
            Makale Kütüphanesi
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Hukuki içtihatlar, doktrin tartışmaları ve güncel akademik yayınlara erişin.
          </p>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="max-w-2xl mx-auto mb-16 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
          <form method="get" className="relative flex items-center bg-[#1e293b] rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
            <div className="pl-4 text-slate-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              name="search"
              type="text"
              defaultValue={search}
              placeholder="Makale başlığı, yazar veya konu ara..."
              className="flex-1 px-4 py-4 bg-transparent text-white placeholder-slate-500 focus:outline-none text-lg"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors border-l border-slate-700"
            >
              ARA
            </button>
          </form>
        </div>

        {/* --- CONTENT GRID --- */}
        <div className="mb-12">
          {makaleler.length > 0 ? (
            // MakaleListClient'ı sarmalıyoruz, stilini o bileşen içinde de güncelleyeceğiz veya
            // direkt burada grid içinde prop olarak geçeceğiz.
            // (Client bileşeni aşağıda güncellenmiş haliyle verilecek)
            <MakaleListClient
              initialMakaleler={makaleler}
              initialFavDois={favDois}
            />
          ) : (
            <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
              <div className="inline-flex p-4 rounded-full bg-slate-800 text-slate-500 mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white">Sonuç Bulunamadı</h3>
              <p className="text-slate-400 mt-2">Arama kriterlerinizi değiştirerek tekrar deneyin.</p>
            </div>
          )}
        </div>

        {/* --- PAGINATION --- */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 pt-8 border-t border-slate-800">
            {page > 1 ? (
              <Link
                href={`?page=${page - 1}&search=${encodeURIComponent(search)}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all border border-slate-700 hover:border-indigo-500/50 group"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Önceki
              </Link>
            ) : (
              <span className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Önceki
              </span>
            )}

            <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-400 font-mono text-sm">
              <span className="text-white font-bold">{page}</span> <span className="mx-1">/</span> {totalPages}
            </div>

            {page < totalPages ? (
              <Link
                href={`?page=${page + 1}&search=${encodeURIComponent(search)}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all border border-slate-700 hover:border-indigo-500/50 group"
              >
                Sonraki
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            ) : (
              <span className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed">
                Sonraki
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
