"use client";

// =============================================================================
// MobileTabBar — yalnızca mobil/tablet (xl altı) düzende görünen alt sekme çubuğu.
// Tek seferde tek panel gösterilir; bu çubukla paneller arası geçiş yapılır.
// =============================================================================

export default function MobileTabBar({ vm }) {
  const {
    mobileTab,
    setMobileTab,
    aiDecisions,
    aiStatutes,
    notes,
  } = vm;

  const tabs = [
    {
      id: "chat",
      label: "Sohbet",
      count: null,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z" />
      ),
    },
    {
      id: "decisions",
      label: "Kararlar",
      count: aiDecisions?.length || 0,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M5 7l-2 6h4l-2-6zm14 0l-2 6h4l-2-6zM4 13a3 3 0 006 0M14 13a3 3 0 006 0M8 21h8M9 6h6" />
      ),
    },
    {
      id: "statutes",
      label: "Mevzuat",
      count: aiStatutes?.length || 0,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5C10.5 5 8 4.5 5 5v13c3-.5 5.5 0 7 1.5 1.5-1.5 4-2 7-1.5V5c-3-.5-5.5 0-7 1.5zM12 6.5V20" />
      ),
    },
    {
      id: "notes",
      label: "Notlar",
      count: notes?.length || 0,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h4m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      ),
    },
  ];

  return (
    <nav
      className="shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur-xl xl:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-1">
        {tabs.map((tab) => {
          const active = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              aria-pressed={active}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 transition-colors ${
                active ? "text-blue-700" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  {tab.icon}
                </svg>
                {tab.count > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-black leading-none text-white">
                    {tab.count > 99 ? "99+" : tab.count}
                  </span>
                )}
              </span>
              <span className="truncate text-[10px] font-black leading-none">{tab.label}</span>
              {active && <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-blue-600" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}