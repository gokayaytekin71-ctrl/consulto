// app/cikis/page.js
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function LogoutPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-gray-100 flex items-center justify-center px-4 pb-16">
      <div className="w-full max-w-3xl mx-auto">
        {/* Arka plan parıltısı */}
        <div className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center">
          <div className="h-80 w-80 rounded-full bg-emerald-500/12 blur-3xl" />
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.85)]">
          {/* Üst bar */}
          <div className="flex items-center justify-between px-6 sm:px-8 pt-5 pb-3 border-b border-white/5 bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-900/10">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-400/40 text-emerald-300">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                  className="shrink-0"
                >
                  <path
                    d="M9 6h6M9 18h6M5 9h10M5 15h10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17 8l2.5 2.5L17 13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Oturum kapatıldı
                </p>
                <p className="text-xs text-slate-400">
                  Güvenli çıkış işleminiz başarıyla tamamlandı.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
              <span className="h-1 w-1 rounded-full bg-emerald-400/70" />
              <span>Consulto · Legal Tech Platform</span>
            </div>
          </div>

          {/* İçerik */}
          <div className="px-6 sm:px-10 py-10 sm:py-12 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight">
              Güvenli bir şekilde{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">
                çıkış yaptınız
              </span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Hesabınızdan çıkış yapıldı. Dilediğiniz zaman tekrar giriş yaparak
              kaldığınız yerden devam edebilirsiniz.
            </p>

           

            {/* Butonlar */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-900/40 hover:from-sky-400 hover:to-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 transition"
              >
                Ana sayfaya dön
              </Link>

            
            </div>
          </div>

          {/* Alt bilgi */}
          <div className="px-6 sm:px-8 pb-5 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <p className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500/70" />
              Oturum sonlandırıldı
            </p>
            <p className="text-slate-500/90">
              Bir sorun ile karşılaşırsanız lütfen bizimle iletişime geçin.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}