export const metadata = {
  title: "Bakımdayız",
  robots: {
    index: false,
    follow: false,
  },
};

import ReloadButton from "./ReloadButton";

export default function MaintenancePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#070a13] to-[#0d1633] px-6">
      <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center shadow-2xl">
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-gray-300">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            Geçici Bakım
          </span>
        </div>

        <h1 className="text-3xl font-semibold text-white mb-3">
          Web sitemiz bakımda
        </h1>

        <p className="text-gray-300 leading-relaxed mb-6">
          Daha hızlı ve güvenli bir deneyim için kısa süreliğine bakım
          çalışması yapıyoruz. Birkaç saat içinde geri döneceğiz!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <ReloadButton />

          <a
            href="mailto:info@consultohukuk.com"
            className="rounded-xl border border-white/20 px-5 py-2 text-white hover:bg-white/10 transition"
          >
            İletişime Geç
          </a>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          © {new Date().getFullYear()} Consülto
        </p>
      </div>
    </main>
  );
}