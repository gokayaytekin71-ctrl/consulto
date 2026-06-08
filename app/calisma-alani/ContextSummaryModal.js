"use client";


import { getDecisionKey } from "./workspace-utils";

function renderContextSummaryText(summary) {
  const text = String(summary || "");
  const tokens = text.split(/(Uyuşmazlık\s*:|Gerekçe ve Sonuç\s*:)/g);

  return tokens.map((token, index) => {
    if (/^Uyuşmazlık\s*:$/i.test(token)) {
      return (
        <span key={`summary-title-${index}`} className="font-black text-blue-800">
          {token}
        </span>
      );
    }

    if (/^Gerekçe ve Sonuç\s*:$/i.test(token)) {
      return (
        <span key={`summary-title-${index}`} className="font-black text-emerald-800">
          {token}
        </span>
      );
    }

    return <span key={`summary-text-${index}`}>{token}</span>;
  });
}

export default function ContextSummaryModal({ vm }) {
  const { activeContextSummary, setActiveContextSummary, contextSummaries } = vm;

  const ctxKey = getDecisionKey(activeContextSummary);
  const ctxState = contextSummaries[ctxKey] || {};

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-800">
                Emsal Karar · AI Özeti
              </div>
              {activeContextSummary.code && (
                <div className="mt-2 inline-flex rounded-xl bg-blue-700 px-3 py-1 text-xs font-black text-white shadow-sm">
                  {activeContextSummary.code}
                </div>
              )}
              {activeContextSummary.court && (
                <div className="mt-2 text-[11px] font-bold text-slate-500">
                  {activeContextSummary.court}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveContextSummary(null)}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm hover:bg-slate-50"
            >
              Kapat
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 custom-scrollbar">
          {ctxState.loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-slate-500">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
              <span className="text-sm font-bold">AI özeti getiriliyor...</span>
            </div>
          ) : ctxState.error ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm font-bold text-amber-700">
              {ctxState.error}
            </div>
          ) : ctxState.summary ? (
            <section className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-800">
                AI Özeti
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">
                {renderContextSummaryText(ctxState.summary)}
              </p>
            </section>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-400">
              Bu karar için AI özeti bulunamadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
