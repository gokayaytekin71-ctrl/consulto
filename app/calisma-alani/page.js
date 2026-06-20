"use client";

// =============================================================================
// CalismaAlaniPage — ince birleştirici (composition) bileşeni.
// Tüm mantık useCalismaAlani hook'unda; tüm görünüm parçaları ayrı dosyalarda.
// Burada yalnızca layout iskeleti + parçaların `vm` ile dizilmesi var.
//
// Responsive davranış:
//  - xl (1280px) ve üstü: çok sütunlu masaüstü düzeni (mevcut grid).
//  - xl altı (mobil/tablet): tek seferde tek panel + alt sekme çubuğu;
//    belge paneli soldan kayan çekmece olarak açılır.
// =============================================================================

import useCalismaAlani from "./useCalismaAlani";

import DocumentSidebar from "./DocumentSidebar";
import WorkspaceHeader from "./WorkspaceHeader";
import ChatPanel from "./ChatPanel";
import DecisionsPanel from "./DecisionsPanel";
import StatutesPanel from "./StatutesPanel";
import NotesPanel from "./NotesPanel";
import MobileTabBar from "./MobileTabBar";

import FileDetailModal from "./FileDetailModal";
import ContextSummaryModal from "./ContextSummaryModal";
import DeleteWorkspaceModal from "./DeleteWorkspaceModal";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import FocusModal from "./FocusModal";
import UploadPerspectiveModal from "./UploadPerspectiveModal";
import WorkspaceStyles from "./WorkspaceStyles";

export default function CalismaAlaniPage() {
  const vm = useCalismaAlani();
  const { visiblePanels, hasMounted, isMobile, mobileTab } = vm;

  // SSR + ilk client render'da masaüstü düzeni gösterilir (hydration güvenliği),
  // mount sonrası gerçek ekran genişliğine göre mobil düzene geçilir.
  const useMobile = hasMounted && isMobile;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden workspace-bg text-slate-900 font-sans">
      <div className="flex h-full">
        {/* Sol Panel — yalnızca masaüstünde sütun olarak */}
        {!useMobile && vm.sidebarOpen && <DocumentSidebar vm={vm} />}

        <main className="flex min-w-0 flex-1 flex-col relative z-10">
          {/* Üst Menü & Çalışma Alanı Seçici */}
          <WorkspaceHeader vm={vm} />

          {useMobile ? (
            /* ---------- MOBİL: tek panel + alt sekme çubuğu ---------- */
            <>
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
                <div className="min-h-0 flex-1">
                  {mobileTab === "chat" && <ChatPanel vm={vm} />}
                  {mobileTab === "decisions" && <DecisionsPanel vm={vm} />}
                  {mobileTab === "statutes" && <StatutesPanel vm={vm} />}
                  {mobileTab === "notes" && <NotesPanel vm={vm} />}
                </div>
              </section>
              <MobileTabBar vm={vm} />
            </>
          ) : (
            /* ---------- MASAÜSTÜ: çok sütunlu grid ---------- */
            <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-4 xl:grid-cols-12">
              <div
                className={`min-h-0 ${
                  visiblePanels.decisions || visiblePanels.statutes || visiblePanels.notes
                    ? visiblePanels.notes && (visiblePanels.decisions || visiblePanels.statutes)
                      ? "xl:col-span-5"
                      : "xl:col-span-8"
                    : "xl:col-span-12"
                }`}
              >
                <ChatPanel vm={vm} />
              </div>

              <div className={`${visiblePanels.decisions || visiblePanels.statutes ? "grid" : "hidden"} min-h-0 gap-4 xl:col-span-4`}>
                {visiblePanels.decisions && <DecisionsPanel vm={vm} />}
                {visiblePanels.statutes && <StatutesPanel vm={vm} />}
              </div>

              <div className={`${visiblePanels.notes ? "block" : "hidden"} min-h-0 ${visiblePanels.decisions || visiblePanels.statutes ? "xl:col-span-3" : "xl:col-span-4"}`}>
                <NotesPanel vm={vm} />
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Mobil belge çekmecesi (overlay) */}
      {useMobile && vm.mobileSidebarOpen && (
        <DocumentSidebar vm={vm} drawer onClose={() => vm.setMobileSidebarOpen(false)} />
      )}

      {/* Modallar */}
      {vm.activeFileSummary && <FileDetailModal vm={vm} />}
      {vm.activeContextSummary && <ContextSummaryModal vm={vm} />}
      {vm.workspaceDeleteTarget && <DeleteWorkspaceModal vm={vm} />}
      {vm.isCreateWorkspaceModalOpen && <CreateWorkspaceModal vm={vm} />}
      {vm.activePanel && <FocusModal vm={vm} />}
      {vm.isUploadPerspectiveModalOpen && <UploadPerspectiveModal vm={vm} />}

      <WorkspaceStyles />
    </div>
  );
}