"use client";

export default function WorkspaceHeader({ vm }) {
  const {
    sidebarOpen, setSidebarOpen,
    hasMounted, isMobile,
    mobileSidebarOpen, setMobileSidebarOpen,
    dropdownRef,
    isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen,
    activeWorkspace,
    isLoadingWorkspaces,
    workspaces,
    activeWorkspaceId, setActiveWorkspaceId,
    openDeleteWorkspaceModal,
    setIsCreateWorkspaceModalOpen,
    tokenBalance,
    currentMessageTokenCost,
    isLoadingTokenBalance,
    toggleVisiblePanel,
    visiblePanels,
    aiDecisions,
    aiStatutes,
    notes,
  } = vm;

  return (
    <header className="relative z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/85 px-3 backdrop-blur-2xl md:h-[86px] md:px-6">
      <div className="flex items-center gap-2 min-w-0 flex-1 md:gap-4">
        <button
          type="button"
          onClick={() => {
            // Mobil: belge çekmecesini aç; Masaüstü: sütunu aç/kapat
            if (hasMounted && isMobile) {
              setMobileSidebarOpen((prev) => !prev);
            } else {
              setSidebarOpen((prev) => !prev);
            }
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          title={(hasMounted && isMobile ? mobileSidebarOpen : sidebarOpen) ? "Belgeleri Gizle" : "Belgeleri Göster"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>

        {/* Özel Dropdown Container */}
        <div className="relative min-w-0 flex-1 sm:flex-none sm:min-w-[320px]" ref={dropdownRef}>
          <button
            onClick={() => setIsWorkspaceDropdownOpen((prev) => !prev)}
            className={`flex w-full items-center justify-between gap-3 rounded-[1.35rem] border p-2.5 pl-3 pr-4 transition-all duration-200 ${
              isWorkspaceDropdownOpen
                ? "border-blue-200 bg-blue-50/80 shadow-[0_14px_35px_rgba(37,99,235,0.10)] ring-4 ring-blue-50"
                : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-slate-900 text-white shadow-[0_2px_8px_rgba(29,78,216,0.35)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div className="flex flex-col items-start min-w-0">
                <div className="mb-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Aktif Çalışma
                </div>
                <div className="truncate text-sm font-black text-slate-900 w-full text-left">
                  {activeWorkspace.title}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:flex rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-slate-500 shadow-sm border border-slate-100">
                {activeWorkspace.status}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
                className={`text-slate-400 transition-transform duration-300 ${isWorkspaceDropdownOpen ? "rotate-180 text-blue-600" : ""}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isWorkspaceDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] origin-top-left overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar p-1">
                {isLoadingWorkspaces ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-bold text-slate-500">
                    Çalışma alanları yükleniyor...
                  </div>
                ) : workspaces.length ? (
                  workspaces.map((ws) => {
                    const isActive = ws.id === activeWorkspaceId;
                    return (
                      <div
                        key={ws.id}
                        className={`mb-1 grid w-full grid-cols-[minmax(0,1fr)_42px] items-center gap-2 rounded-2xl transition-all last:mb-0 ${
                          isActive ? "bg-blue-50" : "bg-transparent hover:bg-slate-50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveWorkspaceId(ws.id);
                            setIsWorkspaceDropdownOpen(false);
                          }}
                          className="flex min-w-0 items-center justify-between gap-2 rounded-2xl p-3 text-left"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                isActive
                                  ? "bg-blue-600 text-white shadow-md"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {isActive ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <div className={`block max-w-full truncate text-sm font-black leading-5 ${isActive ? "text-blue-950" : "text-slate-800"}`} title={ws.title}>
                                {ws.title}
                              </div>
                              <div className="block max-w-full truncate text-[11px] font-bold leading-4 text-slate-500" title={ws.subtitle || "Çalışma alanı"}>
                                {ws.subtitle || "Çalışma alanı"}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`ml-1 hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider sm:inline-flex ${
                              isActive
                                ? "border-blue-200 bg-white text-blue-800"
                                : "border-slate-200 bg-slate-50 text-slate-400"
                            }`}
                          >
                            {ws.status || "Aktif"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteWorkspaceModal(ws);
                          }}
                          className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                          title="Çalışma alanını sil"
                          aria-label="Çalışma alanını sil"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-bold text-slate-500">
                    Henüz çalışma alanı yok. Aşağıdan yeni çalışma oluşturabilirsiniz.
                  </div>
                )}
              </div>

              <div className="mt-2 border-t border-slate-100 pt-2 px-1 pb-1">
                <button
                  onClick={() => setIsCreateWorkspaceModalOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Yeni Çalışma Alanı Oluştur
                </button>
              </div>
            </div>
          )}
        </div>


      </div>

      <div className="ml-4 hidden shrink-0 items-center gap-2 xl:flex">
        <div className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-[11px] font-black shadow-sm ${Number.isFinite(Number(tokenBalance)) && Number(tokenBalance) < currentMessageTokenCost ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200/70 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L4.09 13H12L11 22L19.91 11H13L13 2Z" />
          </svg>
          {isLoadingTokenBalance ? "Yükleniyor…" : `${Number.isFinite(Number(tokenBalance)) ? tokenBalance : "–"} token`}
        </div>

        <div className="flex items-center rounded-[1.4rem] border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => toggleVisiblePanel("decisions")}
          className={`group flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-black transition-all ${
            visiblePanels.decisions
              ? "bg-slate-100 text-slate-950"
              : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${visiblePanels.decisions ? "bg-blue-600" : "bg-slate-300"}`} />
          <span>Kararlar</span>
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${visiblePanels.decisions ? "bg-white text-slate-700" : "bg-slate-100 text-slate-400"}`}>
            {aiDecisions.length || 0}
          </span>
        </button>

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <button
          type="button"
          onClick={() => toggleVisiblePanel("statutes")}
          className={`group flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-black transition-all ${
            visiblePanels.statutes
              ? "bg-slate-100 text-slate-950"
              : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${visiblePanels.statutes ? "bg-indigo-600" : "bg-slate-300"}`} />
          <span>Mevzuat</span>
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${visiblePanels.statutes ? "bg-white text-slate-700" : "bg-slate-100 text-slate-400"}`}>
            {aiStatutes.length || 0}
          </span>
        </button>

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <button
          type="button"
          onClick={() => toggleVisiblePanel("notes")}
          className={`group flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-black transition-all ${
            visiblePanels.notes
              ? "bg-slate-100 text-slate-950"
              : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${visiblePanels.notes ? "bg-emerald-600" : "bg-slate-300"}`} />
          <span>Notlar</span>
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${visiblePanels.notes ? "bg-white text-slate-700" : "bg-slate-100 text-slate-400"}`}>
            {notes.length || 0}
          </span>
        </button>
        </div>
      </div>
    </header>
  );
}