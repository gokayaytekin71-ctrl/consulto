"use client";

export default function FileDetailModal({ vm }) {
  const {
    activeFileSummary,
    setActiveFileSummary,
    activeFileDetailTab,
    setActiveFileDetailTab,
    fileNoteDrafts,
    setFileNoteDrafts,
    addFileNote,
    savingFileNoteIds,
    getNotesForFile,
    handleDeleteNote,
  } = vm;

  return (
  <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-800">
              Belge Detayları
            </div>
            <h2 className="mt-2 truncate text-xl font-black text-slate-950">
              {activeFileSummary.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setActiveFileSummary(null)}
            className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm hover:bg-slate-50"
          >
            Kapat
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-white/70 p-1 shadow-sm ring-1 ring-slate-200/70">
          <button
            type="button"
            onClick={() => setActiveFileDetailTab("analysis")}
            className={`rounded-xl px-3 py-2 text-[11px] font-black transition-all ${
              activeFileDetailTab === "analysis"
                ? "bg-blue-700 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Akıllı Analiz
          </button>

          <button
            type="button"
            onClick={() => setActiveFileDetailTab("notes")}
            className={`rounded-xl px-3 py-2 text-[11px] font-black transition-all ${
              activeFileDetailTab === "notes"
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Belge Notlarım
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6 custom-scrollbar">
        {activeFileDetailTab === "analysis" && (
          <div className="space-y-4">
            {activeFileSummary.aiSummary && (
              <section className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-800">
                  Kısa Özet
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">
                  {activeFileSummary.aiSummary}
                </p>
              </section>
            )}

            {activeFileSummary.detailedSummary && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Detaylı Özet
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700">
                  {activeFileSummary.detailedSummary}
                </p>
              </section>
            )}

            {activeFileSummary.legalKeywords?.length ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Hukuki Anahtar Kelimeler
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeFileSummary.legalKeywords.map((keyword) => (
                    <span
                      key={`${activeFileSummary.id}-modal-${keyword}`}
                      className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {activeFileSummary.risks?.length ? (
              <section className="rounded-3xl border border-red-100 bg-red-50/60 p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-red-700">
                  Riskler
                </div>
                <div className="mt-3 space-y-2">
                  {activeFileSummary.risks.map((risk) => (
                    <div
                      key={`${activeFileSummary.id}-risk-${risk}`}
                      className="rounded-2xl bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-700 shadow-sm"
                    >
                      {risk}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {activeFileSummary.defenseIssues?.length ? (
              <section className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  Savunma / Strateji Notları
                </div>
                <div className="mt-3 space-y-2">
                  {activeFileSummary.defenseIssues.map((issue) => (
                    <div
                      key={`${activeFileSummary.id}-defense-${issue}`}
                      className="rounded-2xl bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-700 shadow-sm"
                    >
                      {issue}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

        {activeFileDetailTab === "notes" && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Bu Belgeye Ait Notlarım
                </div>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  Burada yalnızca bu belge için sizin aldığınız notlar görünür. AI analizi bu bölümde gösterilmez.
                </p>
              </div>

              <textarea
                value={fileNoteDrafts[activeFileSummary.id] || ""}
                onChange={(e) =>
                  setFileNoteDrafts((prev) => ({
                    ...prev,
                    [activeFileSummary.id]: e.target.value,
                  }))
                }
                placeholder="Bu belge için not yaz..."
                className="min-h-[150px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              />

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => addFileNote(activeFileSummary)}
                  disabled={
                    !String(fileNoteDrafts[activeFileSummary.id] || "").trim() ||
                    savingFileNoteIds.includes(activeFileSummary.id)
                  }
                  className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {savingFileNoteIds.includes(activeFileSummary.id)
                    ? "Kaydediliyor..."
                    : "Notu Kaydet"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {getNotesForFile(activeFileSummary).length ? (
                getNotesForFile(activeFileSummary).map((note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Belge Notu
                    </div>

                    <div className="whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                      {note.text}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <span className="text-[10px] font-bold text-slate-400">
                        {note.createdAt
                          ? new Date(note.createdAt).toLocaleString("tr-TR")
                          : ""}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="rounded-xl bg-red-50 px-3 py-1.5 text-[10px] font-black text-red-600 transition-all hover:bg-red-100"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center text-xs font-bold text-slate-400">
                  Bu belge için henüz kullanıcı notu yok.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
