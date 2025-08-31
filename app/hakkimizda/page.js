// app/hakkimizda/page.js — basic, dark theme, yönlendirme yok

export const metadata = {
  title: "Hakkımızda — Consülto",
  description:
    "1.000.000+ kararla eğitilmiş yapay zekâ ile dilekçe botu, analiz botu, akıllı aramalar ve hukuki araçlar.",
};

export default function AboutPage() {
  return (
    <main className="min-h-[60vh] text-slate-100">
      {/* Üst metin (kompakt) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 text-cyan-200 text-xs px-3 py-1 ring-1 ring-white/10">
          <span className="font-semibold">1.000.000+</span>
          <span>kararla eğitilmiş yapay zekâ</span>
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">Consülto hakkında</h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-3xl">
          Consülto; dilekçe taslakları, karar/içtihat analizleri, yapay zekâ destekli akıllı aramalar ve
          mevzuata bağlı hesaplama araçlarıyla hukuk iş akışlarını hız ve doğruluk odağında sadeleştirir.
        </p>
      </section>

      {/* Özellikler */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid gap-6 md:grid-cols-4">
          {[
            {
              title: "Dilekçe Botu",
              desc: "Şablon uyumlu, düzenlenebilir ve kaynak gösterimi güçlü taslaklar.",
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>
              ),
            },
            {
              title: "Analiz Botu",
              desc: "Yargıtay kararlarını akıllı özetlerle hızlıca kavrayın; kritik noktaları kaçırmayın.",
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19h16"/><path d="M6 17V9"/><path d="M12 17V5"/><path d="M18 17v-7"/></svg>
              ),
            },
            {
              title: "Akıllı Aramalar",
              desc: "Yapay zekâ destekli, bağlama duyarlı ve hızlı arama deneyimi.",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
              ),
            },
            {
              title: "Hukuki Araçlar",
              desc: "Araç değer kaybı, destekten yoksun kalma, kıdem ve infaz gibi hesaplamalar.",
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>
              ),
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 shadow-sm hover:shadow-md hover:border-cyan-400/30 transition"
            >
              <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow">
                {item.icon}
              </span>
              <h3 className="mt-3 font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Değer önerisi & çalışma prensibi */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-14">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-sm">
            <h3 className="text-white font-semibold">Neden Consülto?</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300 list-disc pl-5">
              <li>Hız: Rutin işleri dakikalara indiren akışlar.</li>
              <li>Doğruluk: Büyük karar korpusu ve mevzuat ile tutarlı sonuçlar.</li>
              <li>Şeffaflık: Varsayımlar ve formüller görünür, müdahaleye açık.</li>
              <li>Uyum: KVKK prensipleri ve veri minimizasyonu yaklaşımı.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-sm">
            <h3 className="text-white font-semibold">Nasıl çalışır?</h3>
            <ol className="mt-3 space-y-2 text-sm text-slate-300 list-decimal pl-5">
              <li>1.000.000+ karar ve destekleyici veriyle eğitilmiş modeller.</li>
              <li>Bağlama duyarlı çıkarım ve hukuki şablon/kurallar.</li>
              <li>Şeffaf çıktılar; istenirse parametrelerle ince ayar.</li>
            </ol>
            <div className="mt-4 text-xs text-slate-400">İrtibat: info@consulto.com.tr</div>
          </div>
        </div>
      </section>
    </main>
  );
}
