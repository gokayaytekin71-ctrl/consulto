"use client";

// Sabit panel aksanları (kararlar, mevzuat)
const FIXED_ACCENTS = {
  kararlar: { stripe: "from-violet-500 to-purple-500", dot: "bg-violet-500" },
  mevzuat:  { stripe: "from-indigo-500 to-blue-500",   dot: "bg-indigo-500" },
};

export default function NotlarimPanel({ id, title, subtitle, children, actions, accentStripe, accentDot }) {
  const fixed  = FIXED_ACCENTS[id];
  const stripe = accentStripe ?? fixed?.stripe ?? "from-emerald-500 to-teal-400";
  const dot    = accentDot    ?? fixed?.dot    ?? "bg-emerald-500";

  return (
    <section className="flex h-full min-h-[260px] overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05),0_8px_32px_-4px_rgba(0,0,0,0.07)] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06),0_16px_48px_-8px_rgba(0,0,0,0.10)]">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Renkli üst şerit */}
        <div className={`h-[3px] w-full shrink-0 bg-gradient-to-r ${stripe}`} />

        {/* Panel başlığı */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white/60 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
            <div className="min-w-0">
              <h3 className="truncate text-[13px] font-black text-slate-900">{title}</h3>
              {subtitle && <p className="truncate text-[10px] font-semibold text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </section>
  );
}
