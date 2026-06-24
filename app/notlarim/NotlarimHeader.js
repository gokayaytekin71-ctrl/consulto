"use client";

function SyncBadge({ syncStatus, isAuthenticated }) {
  if (!isAuthenticated) return null;
  if (syncStatus === "saving") return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-black text-slate-400 shadow-sm">
      <svg className="h-3 w-3 animate-spin text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Kaydediliyor
    </div>
  );
  if (syncStatus === "saved") return (
    <div className="flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[9px] font-black text-emerald-700 shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Kaydedildi
    </div>
  );
  if (syncStatus === "error") return (
    <div className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-[9px] font-black text-red-600 shadow-sm" title="Kaydetme başarısız">
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      Hata
    </div>
  );
  return null;
}

export default function NotlarimHeader({ vm }) {
  const {
    sidebarOpen, setSidebarOpen,
    hasMounted, isMobile,
    mobileSidebarOpen, setMobileSidebarOpen,
    visiblePanels, togglePanel,
    decisions, statutes,
    setIsAddingNote, setAddingNoteTitle,
    syncStatus, isAuthenticated,
  } = vm;

  function openNewNote() {
    if (hasMounted && isMobile) setMobileSidebarOpen(true);
    else setSidebarOpen(true);
    setAddingNoteTitle("");
    setIsAddingNote(true);
  }

  return (
    <header className="relative z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-2xl md:h-[86px] md:px-6">
      <div className="flex items-center gap-2 min-w-0">
        <button type="button"
          onClick={() => { if (hasMounted && isMobile) setMobileSidebarOpen(p => !p); else setSidebarOpen(p => !p); }}
          title={(hasMounted && isMobile ? mobileSidebarOpen : sidebarOpen) ? "Notları Gizle" : "Notları Göster"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>

        <button type="button" onClick={openNewNote} title="Yeni not ekle"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <div className="ml-1 min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400 leading-none">Kişisel</div>
          <div className="mt-0.5 text-[18px] font-black tracking-tight text-slate-900 leading-none">Notlarım</div>
        </div>

        <div className="ml-3">
          <SyncBadge syncStatus={syncStatus} isAuthenticated={isAuthenticated} />
        </div>
      </div>

      <div className="ml-4 hidden shrink-0 items-center gap-2 xl:flex">
        <div className="flex items-center rounded-[1.4rem] border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
          <button type="button" onClick={() => togglePanel("kararlar")}
            className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-black transition-all ${visiblePanels.kararlar ? "bg-slate-100 text-slate-950" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${visiblePanels.kararlar ? "bg-violet-600" : "bg-slate-300"}`} />
            Kararlar
            {decisions.length > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${visiblePanels.kararlar ? "bg-white text-slate-700" : "bg-slate-100 text-slate-400"}`}>{decisions.length}</span>}
          </button>
          <div className="mx-1 h-6 w-px bg-slate-200" />
          <button type="button" onClick={() => togglePanel("mevzuat")}
            className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-black transition-all ${visiblePanels.mevzuat ? "bg-slate-100 text-slate-950" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${visiblePanels.mevzuat ? "bg-indigo-600" : "bg-slate-300"}`} />
            Mevzuat
            {statutes.length > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${visiblePanels.mevzuat ? "bg-white text-slate-700" : "bg-slate-100 text-slate-400"}`}>{statutes.length}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
