

// app/iletisim/page.js — Consülto İletişim (basic, dark uyumlu, yönlendirmesiz backend)

export const metadata = {
  title: "İletişim — Consülto",
  description:
    "Consülto ile iletişim: info@consulto.com.tr adresinden bize ulaşın veya formu doldurun.",
};

export default function ContactPage() {
  return (
    <main className="min-h-[60vh] text-slate-100">
      {/* Başlık */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">İletişim</h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-3xl">
          Sorularınız, önerileriniz veya iş birlikleri için bize yazın. Dilerseniz doğrudan
          <span className="px-1 font-medium text-cyan-300"> info@consulto.com.tr</span>
          adresine e‑posta gönderebilirsiniz.
        </p>
      </section>

      {/* İçerik */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Form */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-white">Bize Yazın</h2>
            <p className="mt-1 text-sm text-slate-400">Form, cihazınızın e‑posta uygulaması üzerinden gönderilir.</p>

            <form
              className="mt-4 space-y-4"
              action="mailto:info@consulto.com.tr"
              method="POST"
              encType="text/plain"
            >
              <div>
                <label htmlFor="name" className="block text-sm text-slate-300">Ad Soyad</label>
                <input
                  id="name"
                  name="Ad Soyad"
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1b2b] px-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="Adınız ve soyadınız"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="block text-sm text-slate-300">E‑posta</label>
                  <input
                    id="email"
                    name="E‑posta"
                    type="email"
                    required
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1b2b] px-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="ornek@alan.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm text-slate-300">Telefon (opsiyonel)</label>
                  <input
                    id="phone"
                    name="Telefon"
                    type="tel"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1b2b] px-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="05xx xxx xx xx"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm text-slate-300">Konu</label>
                <select
                  id="subject"
                  name="Konu"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1b2b] px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  defaultValue="Genel"
                >
                  <option>Genel</option>
                  <option>Ürün / Destek</option>
                  <option>İdari / Faturalama</option>
                  <option>İş Ortaklığı</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm text-slate-300">Mesajınız</label>
                <textarea
                  id="message"
                  name="Mesaj"
                  rows={5}
                  required
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1b2b] px-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="Kısaca iletmek istediklerinizi yazın"
                />
              </div>

              <div className="flex items-start gap-2">
                <input id="consent" type="checkbox" required className="mt-1 h-4 w-4 rounded border-white/20 bg-[#0a1b2b]" />
                <label htmlFor="consent" className="text-xs text-slate-400">
                  KVKK kapsamında kişisel verilerimin; talebime cevap verilebilmesi amacıyla işlenmesini kabul ediyorum.
                </label>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 font-medium text-white shadow"
              >
                Gönder
              </button>

              <p className="text-xs text-slate-500">
                Alternatif: e‑posta istemcisi kullanmıyorsanız doğrudan <span className="text-cyan-300">info@consulto.com.tr</span> adresine yazabilirsiniz.
              </p>
            </form>
          </div>

          {/* Bilgi kartı */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-white">İletişim Bilgileri</h2>
            <div className="mt-3 grid gap-3 text-sm">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-slate-400">E‑posta</div>
                <div className="font-medium text-slate-100">info@consulto.com.tr</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-slate-400">Çalışma Saatleri</div>
                <div className="font-medium text-slate-100">Hafta içi 09:00 – 18:00</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-slate-400">Gizlilik</div>
                <div className="font-medium text-slate-100">KVKK Politikası ve Aydınlatma Metni doğrultusunda</div>
              </div>
            </div>

            <div className="mt-5 h-36 w-full rounded-xl border border-white/10 bg-gradient-to-br from-[#001f3f]/30 to-[#004365]/30" />
            <p className="mt-2 text-xs text-slate-500">Not: Harita/Adres bilgisi talep üzerine paylaşılacaktır.</p>
          </div>
        </div>
      </section>
    </main>
  );
}