// app/araclar/page.js — Ana giriş: yönlendirme yok, boş durum + hızlı erişim ızgarası
export const metadata = {
  title: "Hukuki Hesaplamalar — Araçlar",
};

function CalculatorIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8 11h0.01M12 11h0.01M16 11h0.01M8 15h0.01M12 15h0.01M16 15h0.01" />
    </svg>
  );
}
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
function UsersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function BriefcaseIcon(props){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}
function LockIcon(props){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function StampIcon(props){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 12h6v-1a3 3 0 1 0-6 0v1z" />
      <rect x="4" y="14" width="16" height="3" rx="1" />
      <path d="M3 19h18" />
    </svg>
  );
}
function FileSignatureIcon(props){
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
function PercentIcon(props){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 5L5 19" />
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
    </svg>
  );
}

export default function Page() {
  const items = [
    { href: "/araclar/arac-deger-kaybi", label: "Araç Değer Kaybı", Icon: CarIcon },
    { href: "/araclar/yaralanmali-trafik-kazasi", label: "Yaralanmalı Trafik Kazası", Icon: ScaleIcon },
    { href: "/araclar/destekten-yoksun-kalma", label: "Destekten Yoksun Kalma", Icon: UsersIcon },
    { href: "/araclar/kidem-tazminati", label: "Kıdem Tazminatı", Icon: BriefcaseIcon },
    { href: "/araclar/infaz-hesaplama", label: "İnfaz Hesaplama", Icon: LockIcon },
    { href: "/araclar/vekalet-ucreti-hesaplama", label: "Vekâlet Ücreti", Icon: FileSignatureIcon },
    { href: "/araclar/faiz-hesaplama", label: "Faiz Hesaplama", Icon: PercentIcon },
    { href: "/araclar/islah-harci-hesaplama", label: "Islah Harcı", Icon: StampIcon },
  ];

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl py-10 flex flex-col items-center justify-center text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/50 p-3">
          <CalculatorIcon className="w-6 h-6 text-cyan-300" />
        </div>
        <h1 className="text-xl font-semibold">Soldaki menüden bir hesaplama aracı seçiniz</h1>
        <p className="text-sm text-slate-400 mt-2">Aşağıdan da hızlıca erişebilirsiniz.</p>
      </div>

      {/* Hızlı erişim ızgarası */}
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(({ href, label, Icon }) => (
            <a key={href} href={href}
               className="group rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 px-4 py-4 text-left flex items-start gap-3">
              <span className="shrink-0 rounded-md bg-slate-900/60 border border-slate-700 p-2">
                <Icon className="w-5 h-5 text-cyan-300 group-hover:text-cyan-200" />
              </span>
              <span className="text-sm font-medium leading-snug whitespace-normal break-words">
                {label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}