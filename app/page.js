import Link from "next/link";
import prisma from '../lib/prisma';
import Script from "next/script";
import DecisionCard from '@/components/DecisionCard'; 

// --- BİLEŞEN: TOOL CARD (ARAÇ KARTI) ---
function ToolCard({ href, title, subtitle, icon }) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(0,42,92,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 group-hover:bg-[#002a5c] group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-blue-900/20 group-hover:scale-110">
        {icon}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="font-bold text-slate-700 group-hover:text-[#002a5c] transition-colors leading-tight mb-0.5">{title}</div>
        {subtitle && <div className="text-xs text-slate-400 font-medium line-clamp-1">{subtitle}</div>}
      </div>
      <div className="relative opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-blue-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

// --- VERİ ÇEKME FONKSİYONLARI ---
async function getGundemItems() {
    try {
        const items = await prisma.gundem.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
        return items;
    } catch (error) { return []; }
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
            .filter(Boolean);

        return ordered.map(k => ({
            id: k.fileName.replace(/\.txt$/, ""),
            type: k.type || "Yargıtay Kararı",
            code: k.code || "",
            aiSummary: k.aiSummary || "",
            keywords: k.keywords || "",
            contentLength: k.contentLength || 0
        }));
    } catch (error) { return []; }
}

// --- ANA SAYFA COMPONENT ---
export default async function Home() {
    const [gundemItems, recentDecisions] = await Promise.all([
        getGundemItems(),
        getFeaturedDecisions()
    ]);
    
    const makaleler = await prisma.makale.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    return (
        <main className="min-h-screen bg-[#F8FAFC] text-slate-800 selection:bg-cyan-100 selection:text-cyan-900 overflow-x-hidden relative">
            
            {/* --- SAYFA GENELİ ARKA PLAN --- */}
            <div className="fixed inset-0 -z-50 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-overlay"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-400/5 rounded-full blur-[120px] translate-y-1/2 translate-x-1/4"></div>
            </div>

            {/* =====================================================================================
                BÖLÜM 1: HERO SECTION
               ===================================================================================== */}
            <section className="relative w-full overflow-hidden bg-[#F8FAFC] py-20 px-4 md:py-28 isolate border-b border-slate-100/80">
                
                {/* Animasyonlu Arkaplan */}
                <div className="absolute inset-0 -z-20 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                <div className="absolute top-[-10%] left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-blue-400/30 to-cyan-300/30 blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-indigo-400/30 to-purple-300/30 blur-[120px] animate-pulse delay-1000"></div>

                <div className="mx-auto max-w-7xl relative z-10">
                    
                    {/* BAŞLIK ALANI */}
                    <div className="text-center mb-16 relative">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-white/40 shadow-sm backdrop-blur-md mb-6 animate-fade-in-up">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-bold tracking-wide text-slate-600 uppercase">Abonelik Yok, Sadece Kullandığını Öde</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[1.1] mb-6">
                            Hukukun <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                                Geleceğini
                                <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-500 opacity-40" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.00025 6.99997C25.7501 5.51703 149.522 2.37549 198.003 3.99997" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                            </span> <br />
                            Özgürce Tasarlayın.
                        </h1>
                        
                        <p className="max-w-2xl mx-auto text-xl text-slate-600 font-medium leading-relaxed mb-8">
                            Aylık sabit ücret yok. İhtiyacınız kadar <strong>Token</strong> alın, dilekçe ve analiz botlarını dilediğiniz zaman kullanın.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link 
                                href="/paketler-ucretler" 
                                className="px-8 py-4 rounded-xl bg-[#002a5c] text-white font-bold text-lg shadow-lg hover:shadow-blue-900/20 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                            >
                                🚀 Token Yükle & Başla
                            </Link>
                            <Link 
                                href="/dilekce" 
                                className="px-8 py-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-lg shadow-sm hover:bg-slate-50 transition-all duration-300"
                            >
                                Hemen Dene
                            </Link>
                        </div>
                    </div>

                    {/* BENTO GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[500px]">
                        
                        {/* KART A: DİLEKÇE PRO */}
                        <Link href="/dilekce" className="md:col-span-7 group relative h-full overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 shadow-2xl shadow-blue-900/5 hover:shadow-blue-900/10 transition-all duration-500 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03]"></div>
                            <div className="relative h-full flex flex-col justify-between p-10 z-20">
                                <div>
                                    <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                                        ✍️
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">Dilekçe Pro</h3>
                                    <p className="text-lg text-slate-500 max-w-md">Olay örgüsünü anlatın, profesyonel hukuki dille yazılmış, Yargıtay atıflı dilekçeniz 1 Token karşılığında hazır.</p>
                                </div>
                                <div className="absolute right-[-40px] bottom-[-40px] md:right-[-20px] md:bottom-[-20px] w-[300px] h-[200px] bg-slate-50 rounded-tl-3xl border-t border-l border-slate-200 shadow-xl p-4 transition-transform duration-500 group-hover:translate-x-[-10px] group-hover:translate-y-[-10px]">
                                    <div className="flex gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                                        <div className="h-2 w-full bg-slate-200 rounded animate-pulse delay-75"></div>
                                        <div className="h-2 w-5/6 bg-slate-200 rounded animate-pulse delay-150"></div>
                                        <div className="mt-4 p-2 bg-blue-50 rounded text-xs text-blue-700 font-mono">
                                            {">"} Dava açma zorunluluğu hasıl olmuştur...
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-blue-600 font-bold mt-6 group-hover:gap-4 transition-all">
                                    Oluşturmaya Başla <span className="text-xl">→</span>
                                </div>
                            </div>
                        </Link>

                        {/* SAĞ SÜTUN */}
                        <div className="md:col-span-5 flex flex-col gap-6 h-full">
                            
                            {/* KART B: ANALİZ PRO */}
                            <Link href="/bot" className="group relative flex-1 overflow-hidden rounded-[2.5rem] bg-slate-900 text-white shadow-2xl shadow-orange-900/20 hover:shadow-orange-900/30 transition-all duration-500 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-500/20 rounded-full blur-[80px] group-hover:bg-orange-500/30 transition-colors"></div>
                                <div className="relative h-full flex flex-col justify-center p-10 z-20">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center text-xl shadow-lg shadow-orange-500/30 group-hover:rotate-12 transition-transform duration-300">
                                            🧠
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-orange-200">
                                            Tokenli Sistem
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Analiz Pro</h3>
                                    <p className="text-slate-400 text-sm mb-6">Dosya risk analizi, strateji ve emsal kararlar. Her analiz sadece 1 Token.</p>
                                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-1 overflow-hidden">
                                        <div className="bg-gradient-to-r from-orange-400 to-red-500 h-full w-[85%] rounded-full animate-[width_1.5s_ease-out]"></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-orange-200/70 font-mono">
                                        <span>Bakiye Kontrolü</span>
                                        <span>Anlık İşlem</span>
                                    </div>
                                </div>
                            </Link>

                            {/* KART C: İSTATİSTİKLER */}
                            <div className="h-[140px] grid grid-cols-2 gap-4">
                                <div className="rounded-[2rem] bg-white border border-slate-200 p-6 flex flex-col justify-center items-center text-center shadow-lg hover:border-emerald-200 transition-colors">
                                    <div className="text-3xl font-black text-slate-900 mb-1">₺100</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Başlangıç</div>
                                </div>
                                <div className="rounded-[2rem] bg-gradient-to-br from-indigo-500 to-blue-600 p-6 flex flex-col justify-center items-center text-center shadow-lg text-white">
                                    <div className="text-3xl font-black mb-1">∞</div>
                                    <div className="text-xs font-bold text-white/70 uppercase tracking-wider">Süre Sınırı Yok</div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* YENİ: SİSTEM AVANTAJLARI BAR */}
                    <div className="mt-12 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row justify-around items-center gap-6 text-center md:text-left">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Aylık Ödeme Yok</h4>
                                <p className="text-xs text-slate-500">Sadece ihtiyacınız olduğunda ödeyin.</p>
                            </div>
                        </div>
                        <div className="hidden md:block w-px h-10 bg-slate-200"></div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Süre Sınırı Yok</h4>
                                <p className="text-xs text-slate-500">Aldığınız tokenler asla silinmez.</p>
                            </div>
                        </div>
                        <div className="hidden md:block w-px h-10 bg-slate-200"></div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Güvenli Ödeme</h4>
                                <p className="text-xs text-slate-500">Shopier altyapısı ile koruma altında.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>


            {/* =====================================================================================
                BÖLÜM 2: İÇERİK
               ===================================================================================== */}
            <div className="max-w-screen-xl mx-auto px-4 md:px-6 space-y-24 py-16 relative z-10">
                
                {/* --- 1. KOMUTA MERKEZİ --- */}
                <section>
                    <div className="flex items-end gap-4 mb-8">
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                             <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#002a5c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h2 className="text-4xl font-black text-[#002a5c] tracking-tight leading-none">
                            Komuta Merkezi
                        </h2>
                        <div className="h-1 flex-1 bg-gradient-to-r from-slate-200 to-transparent rounded-full mb-2"></div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { title: "Favori Kararlar", href: "/profilim/favori-kararlar", color: "from-blue-500 to-indigo-600", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
                            { title: "Kütüphanem", href: "/profilim/favori-makaleler", color: "from-teal-400 to-cyan-500", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
                            { title: "Görevlerim", href: "/profilim/gorevlerim", color: "from-purple-500 to-pink-500", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
                            { title: "Notlarım", href: "/profilim/notlarim", color: "from-amber-400 to-orange-500", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" }
                        ].map((item, i) => (
                            <Link key={i} href={item.href} className="group relative h-40 rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 hover:-translate-y-2">
                                <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${item.color} rounded-full blur-[60px] opacity-10 group-hover:opacity-30 group-hover:scale-125 transition-all duration-500`}></div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg shadow-gray-200/50 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                        </svg>
                                    </div>
                                    <span className="text-lg font-bold text-slate-800 group-hover:text-[#002a5c] transition-colors">{item.title}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* --- 2. HUKUK ARAÇLARI --- */}
                <section>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                         <div>
                             <h2 className="text-3xl font-black text-[#002a5c] tracking-tight mb-2">
                                 Hesaplama Araçları
                             </h2>
                             <p className="text-slate-500 font-medium">Günlük hukuki hesaplamalarınız için profesyonel çözümler.</p>
                         </div>
                         <Link href="/araclar" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-full transition-all">
                             Tüm Araçları Gör 
                             <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                         </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <ToolCard href="/araclar/arac-deger-kaybi" title="Araç Değer Kaybı" subtitle="Sigorta Tahkim Uyumlu" icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>} />
                        <ToolCard href="/araclar/yaralanmali-trafik-kazasi" title="Yaralanmalı Kaza" subtitle="Tazminat Hesabı" icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 0 .3" /><path d="M8 9h2" /><rect x="3" y="14" width="18" height="8" rx="2" /><path d="M12 14v8" /><path d="M3 18h18" /></svg>} />
                        <ToolCard href="/araclar/destekten-yoksun-kalma" title="Destekten Yoksun" subtitle="Aktüeryal Hesap" icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                        <ToolCard href="/araclar/kidem-tazminati" title="Kıdem Tazminatı" subtitle="İşçilik Alacakları" icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
                        <ToolCard href="/araclar/infaz-hesaplama" title="İnfaz Hesaplama" subtitle="Yatar Hesabı" icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /></svg>} />
                        <ToolCard href="/araclar/vekalet-ucreti/hesaplama" title="Vekâlet Ücreti" subtitle="AAÜT 2024" icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                        <ToolCard href="/araclar/faiz-hesaplama" title="Faiz Hesaplama" subtitle="Yasal ve Ticari" icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>} />
                        <ToolCard href="/araclar/islah-harci-hesaplama" title="Islah Harcı" subtitle="Dava Harçları" icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19.5 10.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>} />
                    </div>
                </section>

                {/* --- 3. EMSAL KARARLAR --- */}
                <section className="relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#002a5c]/5 blur-[100px] -z-10 rounded-full"></div>

                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-[#002a5c] tracking-tight mb-1">
                                Öne Çıkan Emsaller
                            </h2>
                            <p className="text-slate-500 text-sm">Yargıtay'ın en güncel ve tartışmalı kararlarını inceleyin.</p>
                        </div>
                        
                        <div className="flex gap-2">
                             <button id="featuredPrev" className="h-10 w-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-[#002a5c] hover:text-white hover:border-[#002a5c] transition-all shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                             </button>
                             <button id="featuredNext" className="h-10 w-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-[#002a5c] hover:text-white hover:border-[#002a5c] transition-all shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                             </button>
                        </div>
                    </div>

                    <div className="relative -mx-4 md:-mx-6 px-4 md:px-6">
                        <div id="featuredScroller" className="overflow-x-auto scroll-smooth hide-scrollbar pb-10 pt-2">
                            <div className="flex gap-6 w-max">
                                {recentDecisions.map((decision) => (
                                    <div key={decision.id} className="w-[340px] transform transition-transform duration-300 hover:scale-[1.01]">
                                        <DecisionCard {...decision} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Script id="featured-scroller-controls" strategy="afterInteractive">
                    {`
                      (function () {
                        function getScroller() { return document.getElementById('featuredScroller'); }
                        function step(dir) {
                          var scroller = getScroller();
                          if (!scroller) return;
                          try {
                            var delta = 360; // Bir kart genişliği + gap
                            scroller.scrollBy({ left: dir * delta, behavior: 'smooth' });
                          } catch (e) {}
                        }
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

                {/* --- 4. BİLGİ MERKEZİ --- */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* SOL SÜTUN: RESMİ GAZETE */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-[4rem] transition-transform duration-500 group-hover:scale-110"></div>
                        <h2 className="text-2xl font-black text-[#002a5c] mb-8 flex items-center gap-3 relative z-10">
                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 text-red-600 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                            </span>
                            Resmî Gazete
                        </h2>
                        
                        <div className="space-y-4 relative z-10">
                            {[...Array(5)].map((_, i) => {
                                const d = new Date(); d.setDate(d.getDate() - i);
                                const url = `https://www.resmigazete.gov.tr/eskiler/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.pdf`;
                                return (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group/item flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-red-200 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-xl border border-slate-200 shadow-sm font-serif">
                                                <span className="text-[10px] font-bold text-red-500 uppercase">{d.toLocaleDateString('tr-TR', { month: 'short' })}</span>
                                                <span className="text-lg font-black text-slate-800 leading-none">{d.getDate()}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 group-hover/item:text-red-600 transition-colors">Resmî Gazete</h4>
                                                <p className="text-xs text-slate-500 font-medium">{d.toLocaleDateString('tr-TR', { weekday: 'long' })} Sayısı</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover/item:bg-red-500 group-hover/item:text-white transition-all shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* SAĞ SÜTUN: MAKALELER */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[4rem] transition-transform duration-500 group-hover:scale-110"></div>
                        <h2 className="text-2xl font-black text-[#002a5c] mb-8 flex items-center gap-3 relative z-10">
                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </span>
                            Son Makaleler
                        </h2>

                        <div className="space-y-4 relative z-10">
                            {makaleler.map((m) => (
                                <Link key={m.doi} href={`https://doi.org/${m.doi}`} target="_blank" className="group/item block p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <span className="inline-block px-2 py-1 mb-2 text-[10px] font-bold text-blue-600 bg-blue-100 rounded tracking-wider">AKADEMİK</span>
                                            <h4 className="font-bold text-slate-800 leading-snug group-hover/item:text-blue-700 transition-colors line-clamp-2">
                                                {m.baslik}
                                            </h4>
                                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                                <span>Hukuk Ekibi</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span>2024</span>
                                            </div>
                                        </div>
                                        <div className="mt-1 w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover/item:border-blue-500 group-hover/item:text-blue-500 transition-colors shadow-sm bg-white">
                                           <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 -rotate-45 group-hover/item:rotate-0 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                </section>
            </div>
        </main>
    );
}