// Araçlar için ToolCard bileşeni
function ToolCard({ href, title, subtitle, icon }) {
  return (
    <Link
      href={href}
      className="group h-full flex items-center gap-4 p-5 md:p-6 rounded-2xl bg-white border border-transparent hover:border-orange-500 shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      <span className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white ring-1 ring-cyan-200/40 transition-transform group-hover:scale-110">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="font-semibold text-lg text-gray-900 leading-tight">{title}</div>
        {subtitle && <div className="text-sm text-gray-600 line-clamp-2">{subtitle}</div>}
      </div>
    </Link>
  );
}
import Link from "next/link";
import prisma from '../lib/prisma';
import dynamic from "next/dynamic";
import LoadingOverlay from "@/components/LoadingOverlay";
import Script from "next/script";

// BİLEŞENLER
const GundemSection = dynamic(
  () => import('@/components/GundemSection'),
  { loading: () => <LoadingOverlay />, ssr: false }
);
import DecisionCard from '@/components/DecisionCard.jsx';


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
            <section className="w-full bg-gradient-to-br from-[#001f3f] to-[#004365] py-14 px-6 text-white relative overflow-hidden">
              {/* Arkaplan şekilleri */}
              <div className="absolute inset-0 -z-10 pointer-events-none">
                <svg width="100%" height="100%">
                  <ellipse cx="18%" cy="28%" rx="260" ry="180" fill="#00263a" />
                  <ellipse cx="88%" cy="72%" rx="240" ry="160" fill="#00507a" />
                </svg>
              </div>

              <div className="mx-auto max-w-5xl text-center space-y-6">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                  Hukuk işlerinizi <span className="text-orange-400">hızlandırın</span>
                </h1>
                <div className="max-w-4xl mx-auto">
                  <ul className="grid gap-3 sm:grid-cols-3 text-[15px] text-slate-100/95 items-stretch">
                    {/* Madde 1 */}
                    <li className="group p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all overflow-hidden">
                      <div className="grid grid-cols-[56px,1fr] items-center gap-4 min-h-[56px]">
                        <span className="justify-self-center inline-flex shrink-0 w-12 h-12 items-center justify-center rounded-full ml-1 bg-emerald-400/15 ring-1 ring-emerald-300/30 text-emerald-300 transition-transform group-hover:scale-110">
                          {/* check icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </span>
                        <span className="leading-snug">
                          <strong className="md:whitespace-nowrap">Dilekçe taslakları</strong>
                          <br className="hidden sm:block" />
                          <span className="opacity-90 md:whitespace-nowrap">dakikalar içinde</span>
                        </span>
                      </div>
                    </li>

                    {/* Madde 2 */}
                    <li className="group p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all overflow-hidden">
                      <div className="grid grid-cols-[56px,1fr] items-center gap-4 min-h-[56px]">
                        <span className="justify-self-center inline-flex shrink-0 w-12 h-12 items-center justify-center rounded-full ml-1 bg-amber-400/15 ring-1 ring-amber-300/30 text-amber-300 transition-transform group-hover:scale-110">
                          {/* courthouse icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M12 3l8 4H4l8-4z" />
                            <path d="M3 10h18" />
                            <path d="M6 10v7" />
                            <path d="M10 10v7" />
                            <path d="M14 10v7" />
                            <path d="M18 10v7" />
                            <path d="M2 17h20" />
                          </svg>
                        </span>
                        <span className="leading-snug">
                          <strong className="md:whitespace-nowrap">Yargıtay kararları</strong>
                          <br className="hidden sm:block" />
                          <span className="opacity-90 md:whitespace-nowrap">akıllı özetlerle hızlıca tara</span>
                        </span>
                      </div>
                    </li>

                    {/* Madde 3 */}
                    <li className="group p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all overflow-hidden">
                      <div className="grid grid-cols-[56px,1fr] items-center gap-4 min-h-[56px]">
                        <span className="justify-self-center inline-flex shrink-0 w-12 h-12 items-center justify-center rounded-full ml-1 bg-sky-400/15 ring-1 ring-sky-300/30 text-sky-300 transition-transform group-hover:scale-110">
                          {/* star icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M12 6l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" />
                          </svg>
                        </span>
                        <span className="leading-snug">
                          <strong className="md:whitespace-nowrap">Analiz Pro ile</strong>
                          <br className="hidden sm:block" />
                          <span className="opacity-90 md:whitespace-nowrap">derinlemesine analiz</span>
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Etkileşimli kart CTA'lar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-2">
                  <Link
                    href="/dilekce"
                    className="group block rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all p-6 text-left shadow-lg backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">Dilekçe Pro </h3>
                      <span className="inline-flex items-center gap-1 text-orange-300 text-sm opacity-90 group-hover:translate-x-0.5 transition">
                        Başla
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                    </div>
                    <p className="mt-2 text-slate-200/80">
                      Olayları girin, Sizden istenen bilgileri verin; yargıtay kararı atıflı dilekçeleriniz birkaç dakikada hazır!
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      <li className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-200 text-xs transition-transform duration-200 transform hover:scale-105">Yargıtay Kararlarına Atıf</li>
                      <li className="px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-200 text-xs transition-transform duration-200 transform hover:scale-105">Profesyonel Hukuki Dil</li>
                      <li className="px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-200 text-xs transition-transform duration-200 transform hover:scale-105">Özelleştirilebilir</li>
                    </ul>
                  </Link>

                  <Link
                    href="/bot"
                    className="group block rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all p-6 text-left shadow-lg backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">Analiz Pro</h3>
                      <span className="inline-flex items-center gap-1 text-orange-300 text-sm opacity-90 group-hover:translate-x-0.5 transition">
                        Analiz İste
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                    </div>
                    <p className="mt-2 text-slate-200/80">
                      Konuyu yazın; Eğitilmiş Yapay Zeka Botumuz mevzuat ve içtihat atıflarıyla, analiz yapsın ve uyuşmazlıkla ilgili strateji oluştursun.
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      <li className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-200 text-xs transition-transform duration-200 transform hover:scale-105">Uyuşmazlığa dair derinlemesine inceleme</li>
                      <li className="px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-200 text-xs transition-transform duration-200 transform hover:scale-105">Akıllı Analiz</li>
                      <li className="px-2.5 py-1 rounded-full bg-pink-500/15 text-pink-200 text-xs transition-transform duration-200 transform hover:scale-105">Emsal Kararlar İle Destekleme</li>
                    </ul>
                  </Link>
                </div>

                {/* Güven göstergeleri */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-200/80">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-200 text-xs transition-transform duration-200 transform hover:scale-105">Çoğu 2020 Sonrası 1.000.000+ karar ve sair hukuki belge ile eğitilmiş yapay zeka</span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-200 text-xs transition-transform duration-200 transform hover:scale-105">Akıllı Karar Arama ve Tamamı Özetli Yargıtay Hukuk Daireleri ve Hukuk Genel Kurulu Kararları</span>
                  <span className="px-3 py-1 rounded-full bg-pink-500/15 text-pink-200 text-xs transition-transform duration-200 transform hover:scale-105">Araç Değer Kaybı, Destekten Yoksun Kalma, İş Kazası Tazminatlarıı Hesaplama vb. pek çok araç</span>
                </div>
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

                {/* Araçlar Bölümü */}
                <section>
                  <h2 className="text-3xl font-bold text-[#001f3f] relative pb-2 w-fit mb-8">
                    Hesaplama Araçları
                    <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-orange-500 rounded-full"></span>
                  </h2>
                  {(() => {
                    const tools = [
                      {
                        href: "/araclar/arac-deger-kaybi",
                        title: "Araç Değer Kaybı",
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
                            <path d="M3.5 11l1.5-4A2 2 0 0 1 7 5h10a2 2 0 0 1 2 2l1.5 4" />
                            <rect x="3" y="11" width="18" height="5" rx="2" />
                            <circle cx="7.5" cy="16.5" r="1.5" />
                            <circle cx="16.5" cy="16.5" r="1.5" />
                            {/* düşüş oku */}
                            <path d="M21 4l-6 6" />
                            <path d="M21 8V4h-4" />
                          </svg>
                        ),
                      },
                      {
                        href: "/araclar/yaralanmali-trafik-kazasi",
                        title: "Yaralanmalı Trafik Kazası",
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
                            {/* araç */}
                            <rect x="3" y="12" width="10" height="4" rx="1.5" />
                            <path d="M3.5 12l1.2-3.2A2 2 0 0 1 6.5 7h5.5" />
                            <circle cx="6" cy="16" r="1.3" />
                            <circle cx="12" cy="16" r="1.3" />
                            {/* tıbbi artı */}
                            <circle cx="18" cy="8" r="3" />
                            <path d="M18 6.7v2.6M16.7 8h2.6" />
                          </svg>
                        ),
                      },
                      {
                        href: "/araclar/destekten-yoksun-kalma",
                        title: "Destekten Yoksun Kalma",
                        icon: (
                          // users svg
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                            <circle cx="7" cy="7" r="3" />
                            <circle cx="17" cy="7" r="3" />
                            <path d="M2 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                            <path d="M17 14a4 4 0 014 4v2" />
                          </svg>
                        ),
                      },
                      {
                        href: "/araclar/kidem-tazminati",
                        title: "Kıdem Tazminatı",
                        icon: (
                          // briefcase svg
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                            <rect x="3" y="7" width="18" height="13" rx="2" />
                            <path d="M16 7V5a4 4 0 00-8 0v2" />
                          </svg>
                        ),
                      },
                      {
                        href: "/araclar/infaz-hesaplama",
                        title: "İnfaz Hesaplama",
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
                            <rect x="4" y="6" width="16" height="12" rx="2" />
                            <path d="M8 6v12M12 6v12M16 6v12" />
                          </svg>
                        ),
                      },
                      {
                        href: "/araclar/vekalet-ucreti",
                        title: "Vekâlet Ücreti",
                        icon: (
                          // document svg
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                            <rect x="5" y="3" width="14" height="18" rx="2" />
                            <path d="M9 7h6" />
                            <path d="M9 11h6" />
                            <path d="M9 15h4" />
                          </svg>
                        ),
                      },
                      {
                        href: "/araclar/faiz-hesaplama",
                        title: "Faiz Hesaplama",
                        icon: (
                          // percent svg
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                            <line x1="19" y1="5" x2="5" y2="19" />
                            <circle cx="7.5" cy="7.5" r="1.5" />
                            <circle cx="16.5" cy="16.5" r="1.5" />
                          </svg>
                        ),
                      },
                      {
                        href: "/araclar/islah-harci",
                        title: "Islah Harcı",
                        icon: (
                          // stamp-like svg: base + handle
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                            <rect x="6" y="15" width="12" height="4" rx="2" />
                            <ellipse cx="12" cy="10" rx="4" ry="3" />
                            <rect x="10" y="4" width="4" height="4" rx="2" />
                          </svg>
                        ),
                      },
                    ];
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {tools.map((tool) => (
                          <ToolCard
                            key={tool.href}
                            href={tool.href}
                            title={tool.title}
                            subtitle={tool.subtitle}
                            icon={tool.icon}
                          />
                        ))}
                      </div>
                    );
                  })()}
                </section>

                {/* ÖNE ÇIKAN KARARLAR */}
                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-[#001f3f] relative pb-2 w-fit">
                      Öne Çıkan Kararlar
                      <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-orange-500 rounded-full"></span>
                    </h2>
                    <Link
                      href="/kararlar"
                      className="group text-lg font-semibold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-2"
                    >
                      Tümünü Gör <ArrowRightIcon />
                    </Link>
                  </div>

                  {/* Slider + arrows */}
                  <div className="relative overflow-visible">

                    <div id="featuredScroller" className="overflow-x-auto scroll-smooth">
                      <div className="flex space-x-8 py-4">
                        {recentDecisions.map((decision) => (
                          <div key={decision.id} className="flex-shrink-0 w-96">
                            <DecisionCard {...decision} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* left/right arrow buttons */}
                    <button
                      id="featuredPrev"
                      type="button"
                      aria-label="Önceki"
                      className="hidden md:flex items-center justify-center absolute -left-8 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/95 ring-1 ring-slate-200 shadow-lg hover:bg-white transition z-20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      id="featuredNext"
                      type="button"
                      aria-label="Sonraki"
                      className="hidden md:flex items-center justify-center absolute -right-8 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/95 ring-1 ring-slate-200 shadow-lg hover:bg-white transition z-20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* lightweight client-side scroll logic */}
                  <Script id="featured-scroller-controls" strategy="afterInteractive">
                    {`
                      (function () {
                        function getScroller() {
                          return document.getElementById('featuredScroller');
                        }
                        function step(dir) {
                          var scroller = getScroller();
                          if (!scroller) return;
                          try {
                            var delta = Math.round(scroller.clientWidth * 0.9);
                            scroller.scrollBy({ left: dir * delta, behavior: 'smooth' });
                          } catch (e) {
                            // no-op
                          }
                        }

                        // Event delegation so it works even if buttons mount later
                        document.addEventListener('click', function (ev) {
                          var nextBtn = ev.target.closest('#featuredNext');
                          var prevBtn = ev.target.closest('#featuredPrev');
                          if (nextBtn) { step(1); }
                          if (prevBtn) { step(-1); }
                        }, { passive: true });
                      })();
                    `}
                  </Script>
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

            </div>
        </main>
    );
}