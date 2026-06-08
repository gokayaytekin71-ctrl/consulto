"use client";

import { getDecisionKey } from "./workspace-utils";
import WorkspacePanel from "./WorkspacePanel";
import DecisionCard from "./DecisionCard";
import ContextDecisionRow from "./ContextDecisionRow";

export default function DecisionsPanel({ vm }) {
  const {
    setActivePanel,
    decisionView, setDecisionView,
    aiDecisions,
    contextDecisions,
    savedDecisions,
    savedDecisionIds,
    toggleSavedDecision,
    openContextSummary,
  } = vm;

  return (
    <WorkspacePanel id="decisions" title="Kararlar" subtitle="Not: Kaydedilmeyen kararlar zamanla silinir." setActivePanel={setActivePanel}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex items-center justify-center border-b border-slate-100 bg-white/50 px-4 py-3 backdrop-blur-md">
          <div className="flex w-full max-w-[560px] items-center gap-1 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setDecisionView("ai")}
              aria-pressed={decisionView === "ai"}
              className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-black leading-none transition-all hover:text-slate-700 sm:py-2 ${
                decisionView === "ai"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                <span>Yararlanılan</span>
                {aiDecisions.length > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800">
                    {aiDecisions.length}
                  </span>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDecisionView("context")}
              aria-pressed={decisionView === "context"}
              className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-black leading-none transition-all hover:text-slate-700 sm:py-2 ${
                decisionView === "context"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                <span>Emsal</span>
                {contextDecisions.length > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800">
                    {contextDecisions.length}
                  </span>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDecisionView("saved")}
              aria-pressed={decisionView === "saved"}
              className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-black leading-none transition-all hover:text-slate-700 sm:py-2 ${
                decisionView === "saved"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                <span>Kayıtlılar</span>
                {savedDecisions.length > 0 && (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-700">
                    {savedDecisions.length}
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 custom-scrollbar">
          {decisionView === "ai" ? (
            aiDecisions.length ? aiDecisions.map((decision) => {
              const decisionKey = getDecisionKey(decision);
              const saved = savedDecisionIds.includes(decisionKey);

              return (
                <DecisionCard
                  key={decisionKey}
                  decision={decision}
                  saved={saved}
                  onToggleSave={() => toggleSavedDecision(decisionKey)}
                  primaryLabel={saved ? "Kaydedildi" : "Kaydet"}
                />
              );
            }) : (
              <div className="flex flex-col items-center justify-center h-full rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
                <span className="text-2xl mb-2 opacity-40">⚖️</span>
                <div className="text-xs font-bold text-slate-500">Henüz Consülto tarafından bulunan karar yok.</div>
              </div>
            )
          ) : decisionView === "context" ? (
            contextDecisions.length ? contextDecisions.map((decision) => (
              <ContextDecisionRow
                key={getDecisionKey(decision)}
                decision={decision}
                onOpenSummary={() => openContextSummary(decision)}
              />
            )) : (
              <div className="flex flex-col items-center justify-center h-full rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
                <span className="text-2xl mb-2 opacity-40">🔍</span>
                <div className="text-xs font-bold text-slate-500">
                  Henüz bağlam kararı yok.
                </div>
              </div>
            )
          ) : savedDecisions.length ? (
            savedDecisions.map((decision) => (
              <DecisionCard
                key={getDecisionKey(decision)}
                decision={decision}
                saved
                onToggleSave={() => toggleSavedDecision(getDecisionKey(decision))}
                primaryLabel="Kaldır"
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
              <span className="text-2xl mb-2 opacity-40">⚖️</span>
              <div className="text-xs font-bold text-slate-500">Henüz kaydedilen karar yok.</div>
            </div>
          )}
        </div>
      </div>
    </WorkspacePanel>
  );
}
