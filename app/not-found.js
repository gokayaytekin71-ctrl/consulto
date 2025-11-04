// app/not-found.js
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-gray-100 flex items-center justify-center px-4 pb-16">
      <div className="w-full max-w-3xl mx-auto">
        {/* Arka plan parıltısı */}
        <div className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center">
          <div className="h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.85)]">
          {/* Üst çubuk */}
          <div className="flex items-center justify-between px-6 sm:px-8 pt-5 pb-3 border-b border-white/5 bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-900/10">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-400/40 text-blue-300">
                {/* küçük ikon */}
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                  className="shrink-0"
                >
                  <path
                    d="M12 4a8 8 0 1 0 8 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 8v5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="15.5"
                    r=".75"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Hata !
                </p>
                <p className="text-xs text-slate-400">
                  Aradığınız sayfa sistemde bulunamadı.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
              <span className="h-1 w-1 rounded-full bg-emerald-400/70" />
              <span>Consülto · Legal Tech Platform</span>
            </div>
          </div>

          {/* İçerik */}
          <div className="px-6 sm:px-10 py-10 sm:py-12 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight">
              Aradığınız sayfa{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                bulunamadı
              </span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Adresi yanlış yazmış olabilirsiniz, sayfa taşınmış olabilir ya da artık
              mevcut olmayabilir. Menüden diğer modüllere geçebilir veya ana sayfaya dönebilirsiniz.
            </p>

            {/* Öneri rozetleri */}
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/70 bg-slate-900/60 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
               Lütfen URL&apos;yi kontrol edin
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/70 bg-slate-900/60 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Üst menüden başka bir modül seçin
              </span>
            </div>

            {/* Butonlar */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-900/40 hover:from-sky-400 hover:to-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 transition"
              >
                Ana sayfaya dön
              </Link>

              <Link
                href="/dilekce"
                className="inline-flex items-center justify-center rounded-xl border border-slate-600 bg-slate-900/70 px-5 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-800/90 hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/60 transition"
              >
                Dilekçe Pro&apos;ya git
              </Link>

              <Link
                href="/bot"
                className="inline-flex items-center justify-center rounded-xl border border-slate-600/80 bg-slate-900/70 px-5 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-800/90 hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/60 transition"
              >
                Analiz Pro'ya git
              </Link>
            </div>
          </div>

          {/* Alt bilgi */}
          <div className="px-6 sm:px-8 pb-5 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <p className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500/70" />
              Sayfa bulunamadı ·
            </p>
            <p className="text-slate-500/90">
              Bunun bir hata olduğunu düşünüyorsanız lütfen bizimle iletişime geçin.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}