// components/Footer.jsx
import Link from "next/link";

// --- YARDIMCI BİLEŞEN: NavLink ---
// Hover olunca sağa kayan ve rengi açılan özel link
function NavLink({ href, children }) {
  return (
    <Link
      href={href}
      className="group flex items-center text-[14px] text-slate-400 hover:text-cyan-400 transition-all duration-300"
    >
      <span className="w-0 opacity-0 -ml-2 group-hover:w-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-cyan-500 mr-1">›</span>
      {children}
    </Link>
  );
}

// --- YARDIMCI BİLEŞEN: SocialButton ---
function SocialButton({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="
        flex h-9 w-9 items-center justify-center rounded-lg 
        bg-white/5 border border-white/10 text-slate-400 
        transition-all duration-300 
        hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]
        active:scale-95
      "
    >
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="relative bg-[#0f172a] text-slate-200 border-t border-white/5 overflow-hidden">
      
      {/* --- BACKGROUND FX --- */}
      {/* Üst Çizgi Gradient */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-70"></div>
      
      {/* Arkadan Vuran Işıklar */}
      <div className="absolute inset-0 pointer-events-none z-0">
         <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px]" />
         <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[100px]" />
         <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:py-16">
        
        {/* Üst Kısım: Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* KOLON 1: Tanıtım & Sosyal (Sol Taraf - 4 birim) */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-cyan-400 to-indigo-600 rounded-full"></span>
                Keşfet
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-400 max-w-sm">
                Yapay zeka destekli dilekçe botları, çalışma alanları, akıllı içtihat arama ve hukuki hesaplama araçlarıyla mesleki süreçlerinizi hızlandırın.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <SocialButton href="mailto:info@consulto.com" label="E-posta">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                  <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="M22 6l-10 7L2 6" />
                </svg>
              </SocialButton>
              <SocialButton href="https://x.com/Consulto_ai" label="X (Twitter)">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </SocialButton>
              <SocialButton href="https://linkedin.com/" label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 21.227.792 22 1.771 22h20.451C23.2 22 24 21.227 24 20.271V1.729C24 .774 23.2 0 22.226 0z"/></svg>
              </SocialButton>
            </div>
          </div>

          {/* KOLON 2: Linkler (Orta - 5 birim) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2 inline-block">
                Ürünler
              </h3>
              <nav className="flex flex-col space-y-3">
                <NavLink href="/dilekce">Dilekçe Botu</NavLink>
                <NavLink href="/bot">Analiz Botu</NavLink>
                <NavLink href="/araclar">Hukuk Araçları</NavLink>
                <NavLink href="/akilli-arama">Akıllı Arama</NavLink>
                <NavLink href="/calisma-alani">Çalışma Alanı</NavLink>
              </nav>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2 inline-block">
                Kurumsal
              </h3>
              <nav className="flex flex-col space-y-3">
                <NavLink href="/hakkimizda">Hakkımızda</NavLink>
                <NavLink href="/iletisim">İletişim</NavLink>
                <NavLink href="/aydinlatma-metni">Aydınlatma Metni</NavLink>
                <NavLink href="/kvkk-politikasi">KVKK Politikası</NavLink>
                <NavLink href="/paketler-ucretler">Paketler & Ücretler</NavLink>
              </nav>
            </div>
          </div>

          {/* KOLON 3: Logo (Sağ Taraf - 3 birim) */}
          <div className="lg:col-span-3 lg:flex lg:flex-col lg:items-end lg:text-right">
             <div className="relative group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors duration-500">
                {/* Logo Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 flex flex-col items-center lg:items-end gap-3">
                   {/* Logo Placeholder - Kendi logonun path'ini buraya koy */}
                   <img
                     src="/images/logo.png"
                     alt="Consülto"
                     width={160}
                     height={45}
                     className="h-10 w-auto object-contain drop-shadow-md opacity-90 group-hover:opacity-100 transition-opacity"
                   />
                   
                   <a
                     href="mailto:info@consulto.com.tr"
                     className="text-sm font-medium text-slate-300 hover:text-white transition-colors border-b border-dashed border-slate-500 hover:border-white pb-0.5"
                   >
                     info@consulto.com.tr
                   </a>
                </div>
             </div>
          </div>

        </div>

        {/* Alt Bar: Copyright */}
        <div className="mt-16 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium">
            © {new Date().getFullYear()} Consülto Legal Tech Platform — Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                System v3
             </span>
          </div>
        </div>

      </div>
    </footer>
  );
}