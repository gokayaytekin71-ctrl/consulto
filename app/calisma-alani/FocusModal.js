"use client";

import { getPanelTitle, getDecisionKey, getStatuteKey } from "./workspace-utils";
import RichMessageText from "./RichMessageText";
import DecisionCard from "./DecisionCard";
import ContextDecisionRow from "./ContextDecisionRow";
import ExpandableNoteText from "./ExpandableNoteText";

export default function FocusModal({ vm }) {
  const {
    activePanel, setActivePanel,
    messages,
    decisionView, setDecisionView,
    aiDecisions,
    contextDecisions,
    savedDecisions,
    savedDecisionIds,
    toggleSavedDecision,
    openContextSummary,
    aiStatutes,
    notes,
    isNoteExpanded,
    toggleNoteExpanded,
    handleDeleteNote,
  } = vm;

  return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/30 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-5 backdrop-blur-xl">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-900">
                  Odak Modu
                </div>
                <div className="mt-1 text-xl font-black text-slate-950">
                  {getPanelTitle(activePanel)}
                </div>
              </div>
              <button
                onClick={() => setActivePanel(null)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                Kapat
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-5 text-sm custom-scrollbar">
              {activePanel === "chat" && (
                <div className="mx-auto max-w-4xl space-y-4">
                  {messages.map((message) => {
                    const isUser = message.role === "user";
                    return (
                      <div key={message.id} className="flex w-full">
                        <div
                          className={[
                            isUser
                              ? "ml-auto max-w-[78%] rounded-3xl border px-5 py-4 shadow-sm"
                              : "mr-auto w-full rounded-3xl border px-5 py-4 shadow-sm",
                            isUser
                              ? "border-blue-800 bg-gradient-to-br from-blue-800 to-blue-950 text-white rounded-tr-sm"
                              : "border-slate-200 bg-white text-slate-800 rounded-tl-sm",
                          ].join(" ")}
                        >
                          <RichMessageText text={message.text} isUser={isUser} autoLink={!isUser} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activePanel === "decisions" && (
                <div className="mx-auto max-w-5xl">
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-blue-900">Kararlar</div>
                      <div className="mt-1 text-xs font-bold text-slate-500">
                        Yararlanılan, bağlam ve kaydedilen kararlar geniş görünümde listelenir.
                      </div>
                    </div>
                    <div className="flex rounded-2xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setDecisionView("ai")}
                        className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${decisionView === "ai" ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        Yararlanılan
                        {aiDecisions.length > 0 && (
                          <span className="ml-1 rounded-full bg-blue-100 px-1.5 text-[10px] text-blue-800">
                            {aiDecisions.length}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisionView("context")}
                        className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${decisionView === "context" ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        Tüm Bağlam
                        {contextDecisions.length > 0 && (
                          <span className="ml-1 rounded-full bg-slate-200 px-1.5 text-[10px] text-slate-600">
                            {contextDecisions.length}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisionView("saved")}
                        className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${decisionView === "saved" ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        Kayıtlılar
                      </button>
                    </div>
                  </div>

                  {decisionView === "context" ? (
                    contextDecisions.length ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {contextDecisions.map((decision) => (
                          <ContextDecisionRow
                            key={getDecisionKey(decision)}
                            decision={decision}
                            onOpenSummary={() => openContextSummary(decision)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/70 p-10 text-center text-sm font-bold text-slate-500">
                        Henüz bağlam kararı yok.
                      </div>
                    )
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {(decisionView === "ai" ? aiDecisions : savedDecisions).length ? (
                        (decisionView === "ai" ? aiDecisions : savedDecisions).map((decision) => {
                          const decisionKey = getDecisionKey(decision);
                          const saved = savedDecisionIds.includes(decisionKey);
                          return (
                            <DecisionCard
                              key={decisionKey}
                              decision={decision}
                              saved={decisionView === "saved" ? true : saved}
                              onToggleSave={() => toggleSavedDecision(decisionKey)}
                              primaryLabel={decisionView === "saved" ? "Kaldır" : saved ? "Kaydedildi" : "Kaydet"}
                            />
                          );
                        })
                      ) : (
                        <div className="col-span-full rounded-3xl border-2 border-dashed border-slate-200 bg-white/70 p-10 text-center text-sm font-bold text-slate-500">
                          Bu bölümde henüz karar yok.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activePanel === "statutes" && (
                <div className="mx-auto max-w-4xl space-y-3">
                  {aiStatutes.length ? (
                    aiStatutes.map((item) => {

                      return (
                        <div key={item.id || getStatuteKey(item)} className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-sm font-black text-slate-900">{item.name}</div>
                              <div className="mt-2 text-xs font-medium leading-6 text-slate-500">{item.note}</div>
                              {item.content && (
                                <div className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                                  {item.content}
                                </div>
                              )}
                            </div>
                           <div className="flex shrink-0 flex-col items-end gap-2">
  <div className="rounded-xl bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{item.article}</div>
</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/70 p-10 text-center text-sm font-bold text-slate-500">
                      Henüz AI tarafından bulunan mevzuat yok.
                    </div>
                  )}
                </div>
              )}

              {activePanel === "notes" && (
                <div className="mx-auto max-w-4xl space-y-4">
                  {notes.length ? (
                    notes.map((note) => (
                      <div key={note.id} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="rounded-xl bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-800">
                            {note.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="rounded-xl bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            Sil
                          </button>
                        </div>
                        <ExpandableNoteText
                          text={note.text}
                          expanded={isNoteExpanded(note.id)}
                          onToggle={() => toggleNoteExpanded(note.id)}
                          maxLength={1200}
                          className="text-sm font-medium leading-7 text-slate-700"
                          buttonClassName="mt-3 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-800 hover:bg-blue-100"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/70 p-10 text-center text-sm font-bold text-slate-500">
                      Henüz not yok.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
  );
}
