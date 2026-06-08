"use client";

export default function WorkspacePanel({ id, title, subtitle, children, setActivePanel, actions }) {
  return (
    <section className="flex h-full min-h-[260px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-slate-900">{title}</h3>
            <p className="truncate text-[11px] font-medium text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <button
              onClick={() => setActivePanel(id)}
              className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              Büyüt
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </section>
  );
}
