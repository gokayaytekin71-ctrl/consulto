

// app/paketler-ucretler/page.js — Consülto Paketler & Ücretler (basic, dark uyumlu, yönlendirmesiz)

export const metadata = {
  title: "Paketler & Ücretler — Consülto",
  description:
    "Consülto paketleri: Dilekçe Botu, Analiz Botu, Akıllı Aramalar ve Hukuki Araçlar için sade fiyatlandırma.",
};

export default function PricingPage() {
  const plans = [
    {
      name: "Başlangıç",
      price: "₺690/ay",
      yearly: "₺6.900/yıl",
      badge: null,
      summary:
        "Bireysel hukukçular ve yeni başlayan ekipler için temel yetenekler.",
      features: [
        "1 kullanıcı",
        "Dilekçe Botu (aylık makul kullanım)",
        "Analiz Botu (günlük limitli)",
        "Akıllı Aramalar (temel)",
        "Hukuki araçlar: çekirdek set",
        "Temel destek (e‑posta)",
      ],
    },
    {
      name: "Profesyonel",
      price: "₺1.990/ay",
      yearly: "₺19.900/yıl",
      badge: "En çok tercih edilen",
      summary:
        "Bürolar ve ekipler için gelişmiş sınırlar ve işbirliği imkânları.",
      features: [
        "5 kullanıcı",
        "Dilekçe Botu (artırılmış limitler)",
        "Analiz Botu (öncelikli sıra)",
        "Akıllı Aramalar (gelişmiş)",
        "Hukuki araçlar: tam set",
        "Öncelikli destek",
      ],
    },
    {
      name: "Kurumsal",
      price: "Teklif",
      yearly: "Özel",
      badge: null,
      summary:
        "Büyük ekipler, yüksek hacim ve kurumsal güvenlik/entegrasyon ihtiyaçları için.",
      features: [
        "Sınırsıza yakın kullanıcı",
        "Özel limitler ve SLA",
        "Akıllı Aramalar (kurumsal mod)",
        "Gelişmiş güvenlik ve uyum",
        "Entegrasyonlar (API/SSO)",
        "Özel destek ve eğitim",
      ],
    },
  ];

  return (
    <main className="min-h-[60vh] text-slate-100">
      {/* Başlık */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">Paketler &amp; Ücretler</h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-3xl">
          Dilekçe ve analiz botları, yapay zekâ destekli akıllı aramalar ve mevzuata bağlı hukuki araçları tek çatı
          altında. İhtiyacınıza uygun paketi seçin; dilediğiniz zaman paketinizi yükseltebilirsiniz.
        </p>
        <p className="mt-2 text-xs text-slate-400">Not: Fiyatlar KDV hariçtir. Yıllık alımda indirim uygulanır.</p>
      </section>

      {/* Planlar */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-sm hover:shadow-md"
            >
              {p.badge && (
                <div className="absolute -top-3 left-4 inline-flex items-center rounded-full bg-cyan-500/20 text-cyan-200 text-xs px-3 py-1 ring-1 ring-cyan-500/30">
                  {p.badge}
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <h3 className="text-white font-semibold text-lg">{p.name}</h3>
                <div className="text-right">
                  <div className="text-xl font-semibold text-white">{p.price}</div>
                  <div className="text-xs text-slate-400">{p.yearly}</div>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-300">{p.summary}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-[2px] inline-block h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 h-px bg-white/10" />
              <div className="mt-4 text-xs text-slate-400">
                * Makul kullanım: adil kullanım ilkeleri geçerlidir. Paket sınırları gerektiğinde iyileştirilebilir.
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Karşılaştırma tablosu (özet) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white">Özellik Özeti</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-300">
                <tr>
                  <th className="py-2 pr-4 font-medium">Özellik</th>
                  <th className="py-2 pr-4 font-medium">Başlangıç</th>
                  <th className="py-2 pr-4 font-medium">Profesyonel</th>
                  <th className="py-2 pr-0 font-medium">Kurumsal</th>
                </tr>
              </thead>
              <tbody className="align-top text-slate-200">
                {[
                  ["Kullanıcı sayısı", "1", "5", "Esnek"],
                  ["Dilekçe Botu limiti", "Makul kullanım", "Yüksek", "Özel"],
                  ["Analiz Botu öncelik", "Standart", "Öncelikli", "Özel SLA"],
                  ["Akıllı Aramalar", "Temel", "Gelişmiş", "Kurumsal"],
                  ["Hukuki araçlar", "Çekirdek", "Tam set", "Tam set + Özel"],
                  ["Destek", "E‑posta", "Öncelikli", "Özel destek"],
                ].map((row) => (
                  <tr key={row[0]} className="border-t border-white/10">
                    <td className="py-3 pr-4 text-slate-300">{row[0]}</td>
                    <td className="py-3 pr-4">{row[1]}</td>
                    <td className="py-3 pr-4">{row[2]}</td>
                    <td className="py-3 pr-0">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Not: Özellikler ve sınırlar, ürün yol haritasına göre geliştirilebilir. Talep edilen entegrasyonlar ve
            kurumsal güvenlik ihtiyaçları kapsam dışı değerlendirilebilir.
          </p>
        </div>
      </section>
    </main>
  );
}