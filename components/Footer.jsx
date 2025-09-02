// components/Footer.jsx — kompakt tasarım (2 kolon + alt bar; logo altta)
import Link from "next/link";

function NavLink({ href, children }) {
  return (
    <Link
      href={href}
      className="block text-[14px] text-slate-300 hover:text-white hover:translate-x-0.5 transition"
    >
      {children}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#0a1b2b] text-slate-200 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {/* Üst içerik: 3 sütun (daha sıkı aralıklarla) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Keşfet */}
          <div>
            <h3 className="text-white/95 font-semibold tracking-wide">Keşfet</h3>
            <p className="mt-2 text-sm text-slate-300/90 max-w-prose">
              Dilekçe ve analiz botları, destekleyici hesaplamalar ve özetli karar arama ile hukuki işlerinizi hızlandırın.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <a
                href="mailto:info@consulto.com"
                className="inline-flex w-8 h-8 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition"
                aria-label="E‑posta"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-slate-200">
                  <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
              </a>
              <a
                href="https://x.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-8 h-8 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition"
                aria-label="X (Twitter)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5 text-slate-200"><path d="M4 4l7.5 8.1L4 20h3.2l5.6-6.1L17.9 20H20l-7-7.9L20 4h-3.2l-5.1 5.5L6.1 4H4z"/></svg>
              </a>
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-8 h-8 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition"
                aria-label="LinkedIn"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5 text-slate-200"><path d="M4.98 3.5a2.5 2.5 0 11.02 5.001A2.5 2.5 0 014.98 3.5zM3 9h4v12H3zM10 9h3.8v1.9h.1c.5-.9 1.7-2 3.5-2 3.7 0 4.4 2.4 4.4 5.5V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8-1.7 0-2 1.3-2 2.7V21h-4V9z"/></svg>
              </a>
            </div>
          </div>

          {/* Ürünler + Kurumsal (yakın) */}
          <div className="grid grid-cols-2 gap-8">
            {/* Ürünler */}
            <div>
              <h3 className="text-white/95 font-semibold tracking-wide">Ürünler</h3>
              <nav className="mt-2 space-y-1.5">
                <NavLink href="/dilekce">Dilekçe Botu</NavLink>
                <NavLink href="/bot">Analiz Botu</NavLink>
                <NavLink href="/araclar">Araçlar</NavLink>
                <NavLink href="/akilli-arama">Akıllı Arama</NavLink>
              </nav>
            </div>

            {/* Kurumsal */}
            <div>
              <h3 className="text-white/95 font-semibold tracking-wide">Kurumsal</h3>
              <nav className="mt-2 space-y-1.5">
                <NavLink href="/hakkimizda">Hakkımızda</NavLink>
                <NavLink href="/iletisim">İletişim</NavLink>
                <NavLink href="/aydinlatma-metni">Aydınlatma Metni</NavLink>
                <NavLink href="/kvkk-politikasi">KVKK Politikası</NavLink>
                <NavLink href="/paketler-ucretler">Paketler & Ücretler</NavLink>
              </nav>
            </div>
          </div>

          {/* Sağ: Logo + e‑posta */}
          <div className="flex flex-col items-start justify-center text-left gap-1.5 ml-4 sm:ml-8 md:ml-16">
            <img
              src="/images/logo.png"
              alt="Consülto"
              width={140}
              height={40}
              className="h-9 w-auto object-contain"
            />
            <a
              href="mailto:info@consulto.com.tr"
              className="text-slate-200 hover:text-white text-sm underline decoration-slate-500/50 underline-offset-4"
            >
              info@consulto.com.tr
            </a>
          </div>
        </div>

        {/* Alt bar: telif + sürüm + logo */}
        <div className="mt-6 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>© {new Date().getFullYear()} Consülto — Tüm hakları saklıdır.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="opacity-70">Sürüm: vBeta</span>
          </div>
        </div>
      </div>
    </footer>
  );
}