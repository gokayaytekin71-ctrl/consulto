"use client";

import useNotlarim from "./useNotlarim";
import NotesSidebar from "./NotesSidebar";
import NotlarimHeader from "./NotlarimHeader";
import NoteEditorPanel from "./NoteEditorPanel";
import KararlarPanel from "./KararlarPanel";
import MevzuatPanel from "./MevzuatPanel";
import MobileTabBar from "./MobileTabBar";
import WorkspaceStyles from "../calisma-alani/WorkspaceStyles";

// Genişletilmiş panel başlıkları
const PANEL_TITLES = {
  editor:   "Not Editörü",
  kararlar: "Yargıtay Kararları",
  mevzuat:  "Mevzuat",
};

function ExpandedModal({ vm }) {
  const { expandedPanel, setExpandedPanel } = vm;
  if (!expandedPanel) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/30 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal başlığı */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-xl">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Büyütülmüş Görünüm</div>
            <div className="mt-0.5 text-xl font-black text-slate-950">{PANEL_TITLES[expandedPanel]}</div>
          </div>
          <button
            onClick={() => setExpandedPanel(null)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Kapat
          </button>
        </div>

        {/* Modal içeriği */}
        <div className="min-h-0 flex-1 overflow-hidden bg-slate-100 p-4">
          <div className="h-full">
            {expandedPanel === "editor"   && <NoteEditorPanel vm={vm} />}
            {expandedPanel === "kararlar" && <KararlarPanel   vm={vm} />}
            {expandedPanel === "mevzuat"  && <MevzuatPanel    vm={vm} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotlarimPage() {
  const vm = useNotlarim();
  const { visiblePanels, hasMounted, isMobile, mobileTab, expandedPanel } = vm;

  const useMobile = hasMounted && isMobile;
  const rightCount = (visiblePanels.kararlar ? 1 : 0) + (visiblePanels.mevzuat ? 1 : 0);
  const editorSpan = rightCount === 2 ? "xl:col-span-6" : rightCount === 1 ? "xl:col-span-9" : "xl:col-span-12";

  return (
    <div className="notlarim-page-shell min-h-[calc(100vh-4rem)] overflow-y-auto workspace-bg text-slate-900 font-sans xl:h-[calc(100vh-4rem)] xl:overflow-hidden">
      <style jsx global>{`
        body:has(.notlarim-page-shell) footer {
          display: none !important;
        }
      `}</style>
      <div className="flex min-h-[calc(100vh-4rem)] xl:h-full xl:min-h-0">
        {/* Sol not ağacı — yalnızca masaüstü */}
        {!useMobile && vm.sidebarOpen && <NotesSidebar vm={vm} />}

        <main className="flex min-w-0 flex-1 flex-col relative z-10">
          <NotlarimHeader vm={vm} />

          {useMobile ? (
            /* ── Mobil: tek panel + alt sekme ── */
            <>
              <section className="flex flex-1 flex-col overflow-visible p-3">
                <div className="min-h-[calc(100vh-12rem)] flex-1">
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

      {/* Genişletilmiş panel modal */}
      {expandedPanel && <ExpandedModal vm={vm} />}

      <WorkspaceStyles />
    </div>
  );
}
