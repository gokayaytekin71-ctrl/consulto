"use client";

import useNotlarim from "./useNotlarim";
import NotesSidebar from "./NotesSidebar";
import NotlarimHeader from "./NotlarimHeader";
import NoteEditorPanel from "./NoteEditorPanel";
import KararlarPanel from "./KararlarPanel";
import MevzuatPanel from "./MevzuatPanel";
import MobileTabBar from "./MobileTabBar";
import WorkspaceStyles from "../calisma-alani/WorkspaceStyles";

export default function NotlarimPage() {
  const vm = useNotlarim();
  const { visiblePanels, hasMounted, isMobile, mobileTab } = vm;

  const useMobile = hasMounted && isMobile;
  const rightCount = (visiblePanels.kararlar ? 1 : 0) + (visiblePanels.mevzuat ? 1 : 0);
  const editorSpan = rightCount === 2 ? "xl:col-span-6" : rightCount === 1 ? "xl:col-span-9" : "xl:col-span-12";

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden workspace-bg text-slate-900 font-sans">
      <div className="flex h-full">
        {/* Sol not ağacı — yalnızca masaüstü */}
        {!useMobile && vm.sidebarOpen && <NotesSidebar vm={vm} />}

        <main className="flex min-w-0 flex-1 flex-col relative z-10">
          <NotlarimHeader vm={vm} />

          {useMobile ? (
            /* ── Mobil: tek panel + alt sekme ── */
            <>
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
                <div className="min-h-0 flex-1">
                  {mobileTab === "editor"   && <NoteEditorPanel vm={vm} />}
                  {mobileTab === "kararlar" && <KararlarPanel   vm={vm} />}
                  {mobileTab === "mevzuat"  && <MevzuatPanel    vm={vm} />}
                </div>
              </section>
              <MobileTabBar vm={vm} />
            </>
          ) : (
            /* ── Masaüstü: kararlar ve mevzuat yan yana ── */
            <section className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 gap-4 overflow-hidden p-4 xl:grid-cols-12">
              <div className={`min-h-0 ${editorSpan}`}>
                <NoteEditorPanel vm={vm} />
              </div>
              {visiblePanels.kararlar && (
                <div className="min-h-0 xl:col-span-3">
                  <KararlarPanel vm={vm} />
                </div>
              )}
              {visiblePanels.mevzuat && (
                <div className="min-h-0 xl:col-span-3">
                  <MevzuatPanel vm={vm} />
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Mobil not ağacı çekmecesi */}
      {useMobile && vm.mobileSidebarOpen && (
        <NotesSidebar vm={vm} drawer onClose={() => vm.setMobileSidebarOpen(false)} />
      )}

      <WorkspaceStyles />
    </div>
  );
}
