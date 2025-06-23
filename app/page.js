import Link from "next/link";
import prisma from '../lib/prisma';
import dynamic from "next/dynamic";
import LoadingOverlay from "@/components/LoadingOverlay";

// BİLEŞENLER
import AiBotIllustration from "@/components/AiBotIllustration";
const GundemSection = dynamic(
  () => import('@/components/GundemSection'),
  { loading: () => <LoadingOverlay />, ssr: false }
);
import HomePageSearch from '@/components/HomePageSearch';
import DecisionCard from '@/components/DecisionCard.jsx';
import ChatBotUI from '@/components/ChatBotUI';

// İKONLAR
const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
);

// VERİ ÇEKME FONKSİYONLARI
async function getGundemItems() {
    try {
        const items = await prisma.gundem.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        return items;
    } catch (error) {
        console.error("Gündem verileri çekilirken bir hata oluştu:", error);
        return [];
    }
}
async function getFeaturedDecisions() {
    try {
        const featuredSlugs = [
            "Hukuk_Genel_Kurulu_2020-603E_2024-224K",
            "Hukuk_Genel_Kurulu_2022-1099E_2024-355K",
            "Hukuk_Genel_Kurulu_2022-1241E_2024-9K",
            "Hukuk_Genel_Kurulu_2014-1026E_2015-1765K"
        ];
        const featured = await prisma.Karar.findMany({
            where: { fileName: { in: featuredSlugs.map(s => `${s}.txt`) } },
            select: { id: true, fileName: true, type: true, code: true, aiSummary: true, keywords: true, contentLength: true }
        });
        const ordered = featuredSlugs
            .map(slug => featured.find(k => k.fileName === `${slug}.txt`))
            .filter(k => k !== undefined);
        return ordered.map(k => ({
            id: k.fileName.replace(/\.txt$/, ""),
            type: k.type || "Tip Belirtilmemiş",
            code: k.code || "No Belirtilmemiş",
            aiSummary: k.aiSummary || "(Özet bulunamadı)",
            keywords: k.keywords || "",
            contentLength: k.contentLength || 0
        }));
    } catch (error) {
        console.error("Öne çıkan kararlar çekerken bir veritabanı hatası oluştu:", error);
        return [];
    }
}

export default async function Home() {
    const [gundemItems, recentDecisions] = await Promise.all([
        getGundemItems(),
        getFeaturedDecisions()
    ]);
    // Son 5 makaleyi veritabanından çek
    const makaleler = await prisma.makale.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return (
        // DEĞİŞİKLİK: Ana container, tüm sayfa için tek bir zemin sağlar
        <main className="min-h-screen bg-slate-100 text-gray-800">
            
            {/* YENİ SIRA 1: ARAMA BÖLÜMÜ */}
            <section className="w-full bg-gradient-to-br from-[#001f3f] to-[#004365] py-4 px-8 text-center text-white">
                {/* Arka plan şekilleri */}
                <div className="absolute inset-0 -z-10">
                  <svg width="100%" height="100%">
                    <ellipse cx="30%" cy="40%" rx="300" ry="200" fill="#00263a" fillOpacity="0.5" />
                    <ellipse cx="80%" cy="60%" rx="200" ry="140" fill="#00507a" fillOpacity="0.3" />
                  </svg>
                </div>
                <div className="mx-auto max-w-3xl">
                  <HomePageSearch />
                </div>
            </section>

            {/* YENİ SIRA 2: GÜNDEM BÖLÜMÜ (Tam Genişlikte) */}
            <section className="w-full bg-white overflow-x-hidden relative">
                <GundemSection items={gundemItems} />
            </section>

            
            {/* DİĞER İÇERİK BÖLÜMLERİ */}
            <div className="max-w-screen-xl mx-auto px-4 md:px-6 space-y-8 py-4">
                
                <section>
                  <h2 className="text-3xl font-bold text-[#001f3f] relative pb-2 w-fit mb-8">
                    Hızlı Erişim
                    <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-orange-500 rounded-full"></span>
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                      {/* Hızlı Erişim Kartlarınızın kodu burada (değişiklik yok) */}
                      <Link href="/profilim/favori-kararlar" className="block group"><div className="bg-white p-6 rounded-xl shadow-lg border border-transparent hover:border-orange-500 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center h-full"><div className="w-16 h-16 mb-5 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white transition-transform duration-300 group-hover:scale-110 shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg></div><span className="font-bold text-gray-800 text-lg">Favori Kararlar</span></div></Link>
                      <Link href="/profilim/favori-mevzuat" className="block group"><div className="bg-white p-6 rounded-xl shadow-lg border border-transparent hover:border-orange-500 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center h-full"><div className="w-16 h-16 mb-5 flex items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-white transition-transform duration-300 group-hover:scale-110 shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg></div><span className="font-bold text-gray-800 text-lg">Favori Mevzuat</span></div></Link>
                      <Link href="/profilim/gorevlerim" className="block group"><div className="bg-white p-6 rounded-xl shadow-lg border border-transparent hover:border-orange-500 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center h-full"><div className="w-16 h-16 mb-5 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white transition-transform duration-300 group-hover:scale-110 shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg></div><span className="font-bold text-gray-800 text-lg">Görevlerim</span></div></Link>
                      <Link href="/profilim/notlarim" className="block group"><div className="bg-white p-6 rounded-xl shadow-lg border border-transparent hover:border-orange-500 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center h-full"><div className="w-16 h-16 mb-5 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white transition-transform duration-300 group-hover:scale-110 shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></div><span className="font-bold text-gray-800 text-lg">Notlarım</span></div></Link>
                  </div>
                </section>

                {/* ÖNE ÇIKAN KARARLAR */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-[#001f3f] relative pb-2 w-fit">
                            Öne Çıkan Kararlar
                            <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-orange-500 rounded-full"></span>
                        </h2>
                        <Link href="/kararlar" className="group text-lg font-semibold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-2">
                            Tümünü Gör <ArrowRightIcon/>
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="flex space-x-8 py-4">
                            {recentDecisions.map((decision) => (
                                <div key={decision.id} className="flex-shrink-0 w-96">
                                    <DecisionCard {...decision} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SON 3 GÜN RESMÎ GAZETELER ve MAKALELER */}
                <section className="flex flex-col md:flex-row gap-6">
                  {/* Resmî Gazeteler */}
                  <div className="md:w-1/2 w-full p-6 bg-white rounded-lg shadow">
                    <h2 className="text-3xl font-bold text-[#001f3f] relative pb-2 w-fit mb-8">
                    Resmî Gazete
                      <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-orange-500 rounded-full"></span>
                    </h2>
                    <ul className="space-y-4">
                      {[...Array(6)].map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        const url = `https://www.resmigazete.gov.tr/eskiler/${year}/${month}/${year}${month}${day}.pdf`;
                        const formatted = d.toLocaleDateString('tr-TR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        });
                        return (
                          <li
                            key={url}
                            className="group flex items-center justify-between bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg shadow hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                          >
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-3"
                            >
                              {/* Newspaper emoji or icon */}
                              <span className="text-2xl">📰</span>
                              {/* Title */}
                              <span className="font-semibold text-gray-800 group-hover:text-orange-600">
                                {formatted} günü Resmî Gazete
                              </span>
                            </a>
                            {/* Arrow */}
                            <span className="text-2xl text-orange-400 group-hover:text-orange-600 transition-colors duration-200">
                              ›
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Makaleler */}
                  <div className="md:w-1/2 w-full p-6 bg-white rounded-lg shadow">
                    <h2 className="text-3xl font-bold text-[#001f3f] relative pb-2 w-fit mb-8">
                      Makaleler
                      <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-orange-500 rounded-full"></span>
                    </h2>
                    <ul className="space-y-4">
                      {makaleler.map((m) => (
                        <li
                          key={m.doi}
                          className="group flex items-center justify-between bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg shadow hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                        >
                          <Link
                            href={`https://doi.org/${m.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3"
                          >
                            {/* Book emoji for makale */}
                            <span className="text-2xl">📖</span>
                            <span className="font-semibold text-gray-800 group-hover:text-orange-600">
                              {m.baslik}
                            </span>
                          </Link>
                          <span className="text-2xl text-orange-400 group-hover:text-orange-600 transition-colors duration-200">
                            ›
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* KARARAI BOT */}
                <section>
                    <div className="bg-gradient-to-r from-[#003049] to-[#004365] rounded-xl p-10 flex flex-col md:flex-row items-center justify-between text-white shadow-2xl">
                        <div className="mb-6 md:mb-0 text-center md:text-left">
                            <h3 className="text-4xl font-bold text-[#001f3f] relative pb-2 w-fit mb-4">
                              KararAI Bot'u Deneyin
                              <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-orange-500 rounded-full"></span>
                            </h3>
                            <p className="text-slate-200 text-lg max-w-xl">Karmaşık hukuki sorularınıza saniyeler içinde, kaynak göstererek ve yorumlayarak yanıt alın.</p>
                        </div>
                        <Link
                            href="/bot"
                            className="bg-orange-500 text-white font-bold px-8 py-4 rounded-lg hover:bg-orange-600 transition-transform hover:scale-105 shadow-lg flex-shrink-0"
                        >
                            Hemen Başla
                        </Link>
                    </div>
                </section>
            </div>
            
            <ChatBotUI />
        </main>
    );
}