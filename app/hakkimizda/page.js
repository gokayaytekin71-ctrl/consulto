// app/hakkimizda/page.js

export const metadata = {
  title: "Hakkımızda | Consülto - Yeni Nesil LegalTech ve Hukuk Asistanı",
  description:
    "Geleneksel içtihat programlarının ötesine geçin. Consülto ile uydurma (halüsinasyon) riski olmayan dilekçeler yazın, semantik karar arayın ve dosyalarınızı saniyeler içinde analiz edin.",
  keywords: [
    "hukuki yapay zeka",
    "yapay zeka dilekçe yazma",
    "semantik içtihat arama",
    "yargıtay kararı analizi",
    "vekalet ücreti hesaplama",
    "kıdem tazminatı hesaplama",
    "hukuk programı",
    "legaltech türkiye"
  ],
  alternates: {
    canonical: 'https://consultohukuk.com/hakkimizda',
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Consülto AI",
    "operatingSystem": "Web",
    "applicationCategory": "LegalApplication",
    "description": "Avukatlar için eski nesil arama motorlarının ötesinde; bağlama duyarlı içtihat araması yapan, halüsinasyon riski barındırmayan yapay zeka tabanlı dilekçe ve analiz platformu. Yapay zeka ile chat yapın!",
    "publisher": {
      "@type": "Organization",
      "name": "Consülto AI Legal Tech Platform",
      "url": "https://consultohukuk.com"
    }
  };

  return (
    <main className="min-h-[70vh] text-consulto-text bg-consulto-bg pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-12 text-center md:text-left">
        <div className="inline-flex items-center gap-2 rounded-full bg-consulto-surface/80 border border-consulto-border text-consulto-primary text-xs px-4 py-1.5 mb-6 backdrop-blur-sm">
          <span className="font-bold">7.000.000+</span>
          <span>Nitelikli Kararla Eğitildi</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
          Standart Programların Ötesinde <span className="text-transparent bg-clip-text bg-gradient-to-r from-consulto-primary to-consulto-accent">Hukuki Zeka</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-consulto-muted max-w-3xl leading-relaxed">
          Sıradan sohbet botlarının "uydurma" (halüsinasyon) riskini ve eski nesil içtihat programlarının yetersiz arama yapılarını geride bırakın. Consülto; <strong>Yargıtay atıflı dilekçeler</strong>, konsept anlayan semantik aramalar, dosya analizleri ve soru cevap yapabileceğiniz <strong>sohbet araçlarıyla</strong> avukatların en güvenilir çalışma arkadaşıdır.
        </p>
      </section>

      {/* 5 Ana Modül (Rekabetçi Açıklamalarla İyileştirildi) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <h2 className="sr-only">Consülto Modülleri ve Özellikleri</h2>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            {
              title: "Dilekçe Botu",
              desc: "Jenerik yapay zekaların aksine Türk Hukuku normlarına sadıktır. Halüsinasyon riski barındırmayan; hukuki nedeni isabetli, gerçek Yargıtay kararlarına atıf yapan profesyonel taslaklar üretir. Üstelik dilekçeleriniz .udf formatında indirebilirsiniz!",
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>
              ),
            },
            {
              title: "Akıllı Çalışma Alanı",
              desc: "Yüzlerce sayfalık PDF'leri okutun. Klasik programların yapamadığını yapın; iddianame veya bilirkişi raporunuzdaki aleyhe/lehe delilleri ve gizli riskleri saniyeler içinde profilleyip tespit edin. Soru sorun, dilekçe yazdırın. Her şey tek platformda!",
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M8 14h4" /><path d="M8 17h8" /></svg>
              ),
            },
            {
              title: "Analiz Botu",
              desc: "Sadece karar okumayın, strateji kurun. Karşı tarafın sunabileceği muhtemel argümanları önceden öngörerek çürütün, uyuşmazlığınızın röntgenini çekerek dava yol haritanızı çizin.",
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19h16"/><path d="M6 17V9"/><path d="M12 17V5"/><path d="M18 17v-7"/></svg>
              ),
            },
            {
              title: "Semantik Arama",
              desc: "Kelime eşleşmesine dayalı eski nesil arama devri bitti. Consülto davanızın 'bağlamını' anlar; anahtar kelimeler eşleşmese bile hukuki duruma en uygun o kritik emsal kararı sizin için bulur.",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
              ),
            },
            {
              title: "Hesaplama Araçları",
              desc: "Farklı sitelerde zaman kaybetmeyin. Kıdem, İnfaz, Araç Değer Kaybı veya Destekten Yoksun Kalma gibi hesaplamaları mahkemeye sunulabilir şeffaflıkta, güncel parametrelerle tek tıkla çözün.",
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>
              ),
            },
          ].map((item) => (
            <article
              key={item.title}
              className="group flex flex-col rounded-2xl border border-consulto-border bg-consulto-surface/50 hover:bg-consulto-surface p-6 transition-all duration-300"
            >
              <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-consulto-primary/10 text-consulto-primary mb-5 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-consulto-muted leading-relaxed flex-grow">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* İşleyiş Süreci & İletişim */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Sol: Nasıl Çalışır */}
          <div className="rounded-2xl border border-consulto-border bg-consulto-surface/50 p-8">
            <h2 className="text-2xl text-white font-bold mb-6">3 Adımda Zaman Kazanın</h2>
            <ol className="space-y-6 relative before:absolute before:inset-y-0 before:left-[15px] before:w-[2px] before:bg-consulto-border">
              <li className="relative pl-10">
                <span className="absolute left-0 top-1 flex items-center justify-center w-8 h-8 rounded-full bg-consulto-surface border-2 border-consulto-primary text-consulto-primary font-bold text-sm">1</span>
                <h3 className="text-white font-medium mb-1">Dosyanı Yükle & Koru</h3>
                <p className="text-sm text-consulto-muted">İddianame veya bilirkişi raporunuzu yükleyin. KVKK uyumlu yapımızla verileriniz korunurken, AI saniyeler içinde gizli kalmış vakıaları sizin için profiller.</p>
              </li>
              <li className="relative pl-10">
                <span className="absolute left-0 top-1 flex items-center justify-center w-8 h-8 rounded-full bg-consulto-surface border-2 border-consulto-primary text-consulto-primary font-bold text-sm">2</span>
                <h3 className="text-white font-medium mb-1">Milyonlarca Kararı Tara</h3>
                <p className="text-sm text-consulto-muted">Yapay zeka, dosyanızın içeriğini okuyarak 1.000.000+ güncel Yargıtay kararı içinden en lehinize olanları bulur ve argümanlarınızla eşleştirir.</p>
              </li>
              <li className="relative pl-10">
                <span className="absolute left-0 top-1 flex items-center justify-center w-8 h-8 rounded-full bg-consulto-surface border-2 border-consulto-primary text-consulto-primary font-bold text-sm">3</span>
                <h3 className="text-white font-medium mb-1">Sonuç Odaklı Çıktı Al</h3>
                <p className="text-sm text-consulto-muted">Saatlerce uğraşmadan, isabetli hukuki nedenlere dayanan, mahkemeye sunulmaya hazır dilekçenizi ve strateji notlarınızı anında indirin.</p>
              </li>
            </ol>
          </div>

          {/* Sağ: İletişim & Kurumsal */}
          <div className="rounded-2xl border border-consulto-border bg-gradient-to-br from-consulto-surface to-transparent p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl text-white font-bold mb-4">Gerçek Bir Hukuk Asistanı Deneyimi</h2>
              <p className="text-consulto-muted text-sm mb-6 leading-relaxed">
                Uluslararası standartlarda büyük dil modelleri ve en güncel içtihat veri tabanı ile geliştirilen Consülto, sadece bir arama motoru değil; "Düşünen, üreten ve hesaplayan" yeni nesil mesai arkadaşınızdır. Esnek token veya avantajlı paketlerle hemen tanışın.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-consulto-text">
                  <svg className="w-5 h-5 text-consulto-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  <a href="mailto:info@consulto.com.tr" className="hover:text-white transition-colors font-medium">Kurumsal İletişim: info@consulto.com.tr</a>
                </div>
                <div className="flex items-center gap-3 text-sm text-consulto-text">
                  <svg className="w-5 h-5 text-consulto-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  <span>KVKK Uyumlu ve Şifrelenmiş Veri Güvenliği</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-consulto-border flex justify-between items-center">
              <p className="text-xs text-consulto-muted opacity-80">
                © 2026 Consülto Legal Tech Platform — System v3.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}