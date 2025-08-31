// app/araclar/layout.js — Server Component (inline Sidebar, no client hooks)
import Link from "next/link";
import Script from "next/script";

export const metadata = {
  title: "Hukuki Hesaplamalar — Araçlar",
};

export default function AraclarLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6 grid gap-4 md:grid-cols-[320px_1fr]">
        <Sidebar />
        <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
          {children}
        </div>
        <Script id="araclar-active-script" strategy="afterInteractive">{`(function(){
          function applyActive(){
            var cont = document.getElementById('araclar-sidebar');
            if(!cont) return;
            var links = cont.querySelectorAll('a[href]');
            var path = location.pathname;
            var best = null;
            links.forEach(function(a){
              var href = a.getAttribute('href');
              if(!href) return;
              if(path === href || path.startsWith(href + '/')){
                if(!best || href.length > best.getAttribute('href').length){ best = a; }
              }
            });
            links.forEach(function(a){
              a.removeAttribute('aria-current');
              a.classList.remove('bg-cyan-900/30','border-cyan-700','text-cyan-100','shadow-inner','ring-1','ring-cyan-500/40');
            });
            if(best){
              best.setAttribute('aria-current','page');
              best.classList.add('bg-cyan-900/30','border-cyan-700','text-cyan-100','shadow-inner','ring-1','ring-cyan-500/40');
            }
          }
          document.addEventListener('DOMContentLoaded', applyActive);
          window.addEventListener('popstate', applyActive);
          document.addEventListener('click', function(e){
            var a = e.target.closest('#araclar-sidebar a[href]');
            if(a){
              var links = document.querySelectorAll('#araclar-sidebar a[href]');
              links.forEach(function(x){
                x.removeAttribute('aria-current');
                x.classList.remove('bg-cyan-900/30','border-cyan-700','text-cyan-100','shadow-inner','ring-1','ring-cyan-500/40');
              });
              a.setAttribute('aria-current','page');
              a.classList.add('bg-cyan-900/30','border-cyan-700','text-cyan-100','shadow-inner','ring-1','ring-cyan-500/40');
            }
          }, true);
        })();`}</Script>
      </div>
    </div>
  );
}

function Sidebar() {
  const items = [
    { href: "/araclar/arac-deger-kaybi", label: "Araç Değer Kaybı", Icon: CarIcon },
    { href: "/araclar/yaralanmali-trafik-kazasi", label: "Yaralanmalı Trafik Kazası", Icon: ScaleIcon },
    { href: "/araclar/destekten-yoksun-kalma", label: "Destekten Yoksun Kalma", Icon: UsersIcon },
    { href: "/araclar/kidem-tazminati", label: "Kıdem Tazminatı", Icon: BriefcaseIcon },
    { href: "/araclar/infaz-hesaplama", label: "İnfaz Hesaplama", Icon: LockIcon },
    { href: "/araclar/islah-harci-hesaplama", label: "Islah Harcı Hesaplama", Icon: StampIcon },
    { href: "/araclar/vekalet-ucreti-hesaplama", label: "Vekalet Ücreti Hesaplama", Icon: FileSignatureIcon },
    { href: "/araclar/faiz-hesaplama", label: "Faiz Hesaplama", Icon: PercentIcon },
    
  ];

  return (
    <aside id="araclar-sidebar" className="rounded-xl border border-slate-700 bg-slate-800/90 backdrop-blur p-4 md:sticky md:top-6 h-max shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
      <div className="flex items-center gap-3 px-2 py-2 mb-2">
        <div className="size-9 rounded-full bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 border border-slate-600 flex items-center justify-center shadow-inner">
          <CalculatorIcon className="w-5 h-5 text-cyan-300" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">Hukuki Hesaplamalar</div>
          <div className="text-xs text-slate-400">Araçlar</div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent my-3" />

      <nav className="space-y-1">
        {items.map(({ href, label, Icon }) => (
          <NavItem key={href} href={href} label={label} Icon={Icon} />
        ))}
      </nav>

      <div className="mt-4 text-[11px] text-slate-400 px-2">
        İpucu: Klavyede <kbd className="px-1 py-0.5 rounded border border-slate-600 bg-slate-900">Tab</kbd> ile dolaşabilirsiniz.
      </div>
      <div className="hidden bg-cyan-900/30 border-cyan-700 text-cyan-100 shadow-inner ring-1 ring-cyan-500/40"></div>
    </aside>
  );
}

function NavItem({ href, label, Icon }) {
  const base = "group flex items-start gap-3 px-3 py-2 rounded-lg border transition-colors";
  const off = "border-transparent hover:bg-slate-700/60 hover:border-slate-600";
  return (
    <Link href={href} className={`${base} ${off}`}>
      <span className="p-1.5 rounded-md bg-slate-700/50 text-slate-300 group-hover:text-slate-200 mt-0.5 flex-none">
        <Icon className="w-4 h-4" />
      </span>
      <span className="text-sm font-medium leading-snug whitespace-normal break-words">{label}</span>
      <ChevronRight className="ml-auto w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-300" />
    </Link>
  );
}

// ── Inline icons (no external deps)
function CarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 13l2-5a3 3 0 013-2h6a3 3 0 013 2l2 5" />
      <path d="M5 16h14" />
      <circle cx="7.5" cy="16.5" r="1.5" />
      <circle cx="16.5" cy="16.5" r="1.5" />
    </svg>
  );
}

function ScaleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v18" />
      <path d="M7 6h10" />
      <path d="M5 10l3 6 3-6H5z" />
      <path d="M13 10l3 6 3-6h-6z" />
    </svg>
  );
}

function CalculatorIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8 11h0.01M12 11h0.01M16 11h0.01M8 15h0.01M12 15h0.01M16 15h0.01" />
    </svg>
  );
}

function ChevronRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function UsersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Grup 1: büyük kişi */}
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
      {/* Grup 2: eş/ikinci kişi */}
      <path d="M16 3.5a3 3 0 1 1 0 7" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.8" />
    </svg>
  );
}

function BriefcaseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function StampIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 12h6v-1a3 3 0 1 0-6 0v1z" />
      <rect x="4" y="14" width="16" height="3" rx="1" />
      <path d="M3 19h18" />
    </svg>
  );
}

function FileSignatureIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h4" />
      <path d="M9 17h2" />
      <path d="M13.5 16.5l2.5-2.5a1.6 1.6 0 0 1 2.2 0 1.6 1.6 0 0 1 0 2.2l-2.5 2.5-2.2.3z" />
    </svg>
  );
}

function PercentIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 5L5 19" />
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
    </svg>
  );
}