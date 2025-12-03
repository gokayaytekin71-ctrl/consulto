"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Backend'deki (app/api/payment/start/route.js) ID ve Fiyatlarla eşleşmeli
const PACKAGES = [
  {
    id: 1,
    name: "Başlangıç Paketi",
    price: "₺100",
    tokenCount: "10 Token",
    badge: null,
    summary: "Bireysel denemeler için ideal.",
    features: [
      "10 Kredi Yüklenir",
      "Dilekçe Oluşturma (1 Kredi)",
      "Analiz İsteme (1 Kredi)",
      "Süre sınırı yok",
      "İstediğin zaman harca",
    ],
  },
  {
    id: 2,
    name: "Profesyonel Paket",
    price: "₺400",
    tokenCount: "50 Token",
    badge: "En Popüler",
    summary: "Aktif hukuk büroları ve sık kullanım için tasarruflu seçim.",
    features: [
      "50 Kredi Yüklenir",
      "Yaklaşık %20 daha ucuz",
      "Dilekçe & Analiz Botu",
      "Sınırsız Akıllı Arama",
      "Hesaplama Araçları Tam Erişim",
    ],
  },
  {
    id: 3,
    name: "Uzman Paket",
    price: "₺700",
    tokenCount: "100 Token",
    badge: "Fırsat",
    summary: "Maksimum avantaj.",
    features: [
      "100 Kredi Yüklenir",
      "Yaklaşık %30 daha ucuz",
      "Tam kapsamlı erişim",
      "Kaçırılmayacak fırsat",
      "Ömür boyu geçerli",
    ],
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState(null);

  const handleBuy = async (pkg) => {
    // 1. Giriş kontrolü
    if (!session) {
      alert("Satın alma işlemi için lütfen önce giriş yapınız.");
      router.push("/auth/signin?callbackUrl=/paketler-ucretler");
      return;
    }

    setLoadingId(pkg.id);

    try {
      // 2. Backend'den Shopier formunu iste
      const res = await fetch("/api/payment/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      if (!res.ok) {
        throw new Error("Ödeme başlatılamadı.");
      }

      // 3. Shopier'e yönlendir (Gelen HTML formunu çalıştır)
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

  return (
    <main className="min-h-[80vh] text-slate-100 bg-[#020617]">
      {/* Başlık */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-8 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
          Token Yükle &amp; Hemen Başla
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl">
          Consülto'da abonelik yok, taahhüt yok. İhtiyacın kadar token al, dilediğin zaman dilekçe veya analiz için kullan.
          <span className="ml-1 inline-block bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent font-semibold">
            Üstelik Açılışa özel %50 indirimli!
          </span>
        </p>
      </section>

      {/* Paketler */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <div className="grid gap-8 md:grid-cols-3">
          {PACKAGES.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border bg-white/5 backdrop-blur-sm p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-900/20 ${
                p.badge 
                  ? "border-cyan-500/50 shadow-lg shadow-cyan-900/10" 
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold px-4 py-1 shadow-lg tracking-wide">
                  {p.badge}
                </div>
              )}

              <div className="mb-6">
                <div className="inline-flex items-center rounded-full bg-pink-600/80 text-[11px] font-semibold text-white px-3 py-1 mb-3 shadow-md shadow-pink-900/40">
                  <span className="mr-1">✨</span> Açılışa Özel %50 İndirim
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{p.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{p.price}</span>
                  <span className="text-sm text-slate-400">/ tek seferlik</span>
                </div>
                <div className="mt-2 text-lg font-medium text-cyan-400">
                  {p.tokenCount}
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-6 min-h-[40px]">
                {p.summary}
              </p>

              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-200">
                    <svg className="w-5 h-5 text-cyan-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBuy(p)}
                disabled={loadingId !== null}
                className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2
                  ${
                    p.badge
                      ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600"
                  }
                  ${loadingId !== null ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {loadingId === p.id ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Yönlendiriliyor...
                  </>
                ) : (
                  "Satın Al"
                )}
              </button>
              
              <div className="mt-4 text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Güvenli Ödeme (Shopier)</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bilgilendirme */}
        <div className="mt-12 rounded-2xl border border-white/5 bg-slate-900/50 p-6 max-w-3xl mx-auto text-center">
          <h4 className="text-white font-medium mb-2">Nasıl Çalışır?</h4>
          <p className="text-sm text-slate-400 leading-relaxed">
            Ödemenizi tamamladığınızda tokenleriniz hesabınıza anında yüklenir. 
            Her bir <strong>Dilekçe Oluşturma</strong> işlemi 1 Token, her bir <strong>Detaylı Analiz</strong> işlemi 1 Token harcar. 
            Bakiyeniz asla silinmez, ihtiyacınız olduğunda kullanabilirsiniz.
          </p>
        </div>
      </section>
    </main>
  );
}