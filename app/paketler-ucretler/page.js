"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Backend'deki ID ve Fiyatlarla eşleşmeli (Veri yapısı korundu)
const PACKAGES = [
  {
    id: 1,
    name: "Başlangıç Paketi",
    price: "₺150",
    tokenCount: "5 Token",
    badge: null,
    summary: "Bireysel denemeler için ideal giriş seviyesi.",
    features: [
      "5 Token Yüklenir",
      "Dilekçe Oluşturma (1 Token)",
      "Analiz İsteme (1 Token)",
      "Süre sınırı yok",
      "İstediğin zaman harca",
    ],
  },
  {
    id: 2,
    name: "Profesyonel Paket",
    price: "₺500",
    tokenCount: "25 Token",
    badge: "En Popüler",
    summary: "Aktif hukuk büroları ve sık kullanım için tasarruflu seçim.",
    features: [
      "25 Token Yüklenir",
      "Yaklaşık %33 daha ucuz",
      "Dilekçe & Analiz Botu",
      "Sınırsız Akıllı Arama",
      "Hesaplama Araçları Tam Erişim",
    ],
  },
  {
    id: 3,
    name: "Uzman Paket",
    price: "₺850",
    tokenCount: "50 Token",
    badge: "Fırsat",
    summary: "Maksimum avantaj isteyen profesyoneller için.",
    features: [
      "50 Token Yüklenir",
      "Yaklaşık %30 daha ucuz",
      "Tam kapsamlı erişim",
      "Kaçırılmayacak fırsat",
      "Ömür boyu geçerli",
    ],
  },
  {
    id: 4,
    name: "Sınırsız Paket – 3 Aylık",
    price: "₺3.600",
    tokenCount: "Sınırsız Kullanım",
    badge: "Yeni",
    summary: "3 ay boyunca dilekçe, analiz ve arama işlemlerinde limitsiz erişim.",
    features: [
      "3 Ay Sınırsız Dilekçe",
      "3 Ay Sınırsız Analiz",
      "Sınırsız Akıllı Arama",
      "Tüm Hesaplama Araçları",
      "Öncelikli Destek",
    ],
  },
  {
    id: 5,
    name: "Sınırsız Paket – 6 Aylık",
    price: "₺6.000",
    tokenCount: "Sınırsız Kullanım",
    badge: "Avantajlı",
    summary: "6 ay boyunca tüm özelliklerde kesintisiz ve sınırsız kullanım.",
    features: [
      "6 Ay Sınırsız Dilekçe",
      "6 Ay Sınırsız Analiz",
      "Sınırsız Akıllı Arama",
      "Tüm Hesaplama Araçları",
      "Öncelikli Destek",
    ],
  },
  {
    id: 6,
    name: "Sınırsız Paket – 1 Yıllık",
    price: "₺9.500",
    tokenCount: "Sınırsız Kullanım",
    badge: "En Kârlı",
    summary: "1 yıl boyunca Consülto’nun tüm gücü, tek paketle tamamen sizin.",
    features: [
      "12 Ay Sınırsız Dilekçe",
      "12 Ay Sınırsız Analiz",
      "Sınırsız Akıllı Arama",
      "Tüm Hesaplama Araçları",
      "VIP Destek",
    ],
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState(null);

  // --- Mantık Aynen Korundu ---
  const handleBuy = async (pkg) => {
    if (!session) {
      alert("Satın alma işlemi için lütfen önce giriş yapınız.");
      router.push("/auth/signin?callbackUrl=/paketler-ucretler");
      return;
    }

    setLoadingId(pkg.id);

    try {
      const res = await fetch("/api/payment/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      if (!res.ok) {
        throw new Error("Ödeme başlatılamadı.");
      }

      const html = await res.text();
      document.open();
      document.write(html);
      document.close();
    } catch (error) {
      console.error(error);
      alert("Bir hata oluştu: " + error.message);
      setLoadingId(null);
    }
  };
  // ---------------------------

  // Paketleri gruplara ayır
  const featuredIds = [1, 5, 2]; // En Avantajlı Paketler (sıra önemli)
  const featuredPackages = featuredIds
    .map((id) => PACKAGES.find((p) => p.id === id))
    .filter(Boolean);

  const starterPackages = PACKAGES.filter((p) => p.id <= 3);
  const unlimitedPackages = PACKAGES.filter((p) => p.id >= 4);

  // Kart render fonksiyonu
  const renderPackageCard = (p) => {
    const isFeatured = p.badge !== null;
    return (
      <div
        key={p.id}
        className={`group relative flex flex-col h-full rounded-[2rem] transition-all duration-500 ${isFeatured ? "bg-slate-900/60 border-2 border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.15)] md:-mt-4 md:mb-4 hover:shadow-[0_0_60px_rgba(6,182,212,0.3)] hover:border-cyan-400" : "bg-slate-900/40 border border-white/10 hover:border-white/30 hover:bg-slate-800/50 shadow-xl"} backdrop-blur-xl p-8 lg:p-10 hover:-translate-y-2`}
      >
        {/* Kart İçi Glow Efekti */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none
                  bg-gradient-to-br ${isFeatured ? "from-cyan-500/10 via-transparent to-purple-500/10" : "from-white/5 to-transparent"}`}
        ></div>

        {/* Üst Badge (Popüler/Fırsat vb.) */}
        {p.badge && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
             <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-white text-sm font-bold px-6 py-2 shadow-lg shadow-cyan-500/20 tracking-wide uppercase ring-2 ring-cyan-500/50 ring-offset-2 ring-offset-[#020617]">
               {p.badge}
             </div>
          </div>
        )}

        {/* Kart Başlığı ve Fiyat */}
        <div className="mb-8 relative">
           {/* İndirim Badge'i */}
          <div className={`inline-flex items-center rounded-lg text-xs font-bold text-white px-3 py-1.5 mb-4 shadow-md
            ${isFeatured ? "bg-gradient-to-r from-pink-600 to-purple-600 shadow-pink-900/30" : "bg-slate-700/80"}
          `}>
            <span className="mr-1.5 animate-pulse">✨</span> Özel Mart İndirimleri!
          </div>

          <h3 className={`text-2xl font-bold mb-4 ${isFeatured ? 'text-white' : 'text-slate-100'}`}>{p.name}</h3>
          
          <div className="flex items-end gap-3 mb-4">
            <span className={`text-5xl lg:text-6xl font-extrabold tracking-tight ${isFeatured ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200' : 'text-white'}`}>
                {p.price}
            </span>
            <span className="text-lg text-slate-400 font-medium pb-1">/ tek seferlik</span>
          </div>
          
          {/* Token Sayısı Göstergesi */}
          <div className={`inline-block text-xl font-extrabold px-4 py-2 rounded-xl border
            ${isFeatured 
                ? 'text-cyan-300 bg-cyan-950/50 border-cyan-500/30 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]' 
                : 'text-cyan-500 bg-slate-800/50 border-cyan-900/50'}
          `}>
            {p.tokenCount}
          </div>
        </div>

        <p className="text-base text-slate-300 leading-relaxed mb-8 min-h-[3rem]">
          {p.summary}
        </p>

        {/* Özellikler Listesi */}
        <ul className="space-y-4 mb-10 flex-1">
          {p.features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-200 group/item">
              <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                ${isFeatured ? 'bg-cyan-500/20 text-cyan-300 group-hover/item:bg-cyan-400 group-hover/item:text-cyan-950' : 'bg-slate-800 text-slate-400 group-hover/item:text-white'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[15px] font-medium">{f}</span>
            </li>
          ))}
        </ul>

        {/* Satın Al Butonu */}
        <button
          onClick={() => handleBuy(p)}
          disabled={loadingId !== null}
          className={`relative w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden z-10
            ${
              isFeatured
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_5px_20px_rgba(6,182,212,0.4)] hover:shadow-[0_8px_30px_rgba(6,182,212,0.6)] ring-2 ring-cyan-400/20 hover:ring-cyan-300/50"
                : "bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-700 hover:border-slate-600 shadow-lg hover:shadow-slate-700/20"
            }
            ${loadingId !== null ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"}
          `}
        >
          {/* Buton İçi Işık Efekti (Featured için) */}
          {isFeatured && <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>}

          {loadingId === p.id ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Yönlendiriliyor...
            </>
          ) : (
            <>
              Satın Al
              <svg className={`w-5 h-5 transition-transform duration-300 ${isFeatured ? 'group-hover:translate-x-1' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
        
        <div className="mt-5 text-center flex items-center justify-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Güvenli Ödeme (Shopier Alt Yapısı)
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen relative bg-[#020617] text-white overflow-hidden font-sans">
      {/* Arkaplan Efektleri (Ambient Light) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-700/20 blur-[150px] rounded-full pointer-events-none mix-blend-screen"></div>

      {/* Başlık Alanı */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-24 pb-16 text-center z-10">
        <span className="inline-block mb-4 text-sm font-bold tracking-wider text-cyan-400 uppercase bg-cyan-900/30 px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          Yapay Zeka Destekli Hukuk Asistanı
        </span>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent drop-shadow-sm">
          Gücünüze Güç Katacak <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
             Token Paketleri
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Consülto v2.1 ile hukuk teknolojilerinin zirvesine en uygun fiyatlarla eriş.
        </p>
        <div className="mt-16 flex justify-center">
          <div className="relative w-6 h-10 border-2 border-cyan-400 rounded-full flex justify-center">
            <span className="absolute top-2 w-1 h-1.5 bg-cyan-400 rounded-full animate-scroll-dot"></span>
          </div>
        </div>
      </section>

      {/* Paketler Grid */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pb-32 z-10">
        {/* En Avantajlı Paketler */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center bg-gradient-to-r from-amber-300 to-cyan-300 bg-clip-text text-transparent drop-shadow">
            En Avantajlı Paketler
          </h2>
          <p className="text-base md:text-lg text-slate-300 mb-16 text-center">
            En çok tercih edilen ve en iyi fiyat/performans seçenekleri
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
            {featuredPackages.map(renderPackageCard)}
          </div>
        </div>

        {/* Divider */}
        <div className="my-24 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        {/* Başlangıç Paketleri */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow">
            Başlangıç Paketleri
          </h2>
          <p className="text-base md:text-lg text-slate-300 mb-16 text-center">
            Token bazlı, süresiz kullanım paketleri
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
            {starterPackages.map(renderPackageCard)}
          </div>
        </div>
        {/* Divider */}
        <div className="my-24 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        {/* Sınırsız Paketler */}
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow">
            Sınırsız Paketler
          </h2>
          <p className="text-base md:text-lg text-slate-300 mb-16 text-center">
            Belirli süre boyunca tüm özelliklerde limitsiz erişim
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
            {unlimitedPackages.map(renderPackageCard)}
          </div>
        </div>
        {/* Alt Bilgi Kutusu */}
        <div className="mt-16 relative rounded-3xl border border-purple-500/20 bg-gradient-to-br from-slate-900/80 to-purple-900/20 backdrop-blur-xl p-8 md:p-12 max-w-4xl mx-auto text-center overflow-hidden z-10 shadow-[0_0_50px_rgba(168,85,247,0.15)]">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/30 blur-[100px] rounded-full pointer-events-none"></div>
          <h4 className="text-2xl md:text-3xl font-bold text-white mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Sistem Nasıl İşliyor?
          </h4>
          <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Ödemenizi güvenle tamamladığınız anda tokenleriniz hesabınıza <strong>anında</strong> tanımlanır.
            Her bir <span className="text-cyan-400 font-semibold">Dilekçe Oluşturma (1 Token)</span> veya <span className="text-purple-400 font-semibold">Detaylı Analiz (1 Token)</span> işleminde bakiyenizden düşer.
            Kullanmadığınız tokenler asla silinmez, dilediğiniz zaman kullanabilirsiniz.
          </p>
        </div>
      </section>
      <style jsx global>{`
@keyframes scrollDot {
  0% { transform: translateY(0); opacity: 1; }
  70% { transform: translateY(16px); opacity: 0; }
  100% { opacity: 0; }
}
.animate-scroll-dot {
  animation: scrollDot 1.8s infinite ease-in-out;
}
`}</style>
    </main>
  );
}