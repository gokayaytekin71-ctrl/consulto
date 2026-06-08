"use client";

import { useState } from "react";
import { getDecisionSlug } from "./workspace-utils";

export default function DecisionCard({ decision, saved, onToggleSave, onOpenDetail, primaryLabel }) {
  const decisionSlug = getDecisionSlug(decision);
  const [localDetailOpen, setLocalDetailOpen] = useState(false);
  const openDetail = onOpenDetail || (() => setLocalDetailOpen(true));

  return (
    <>
      <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900">{decision.court}</div>
            <div className="mt-1 inline-block rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
              {decision.code}
            </div>
          </div>
          {saved && (
            <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700">
              Kayıtlı
            </span>
          )}
        </div>

        {(String(decision?.used_part || decision?.usedPart || "").trim() || String(decision?.relevance || "").trim()) && (
          <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
            {String(decision?.used_part || decision?.usedPart || "").trim() ? (
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-blue-800">
                  Yararlanılan Kısım
                </div>
                <div className="mt-1 line-clamp-2 text-[11px] font-medium leading-5 text-slate-700">
                  {decision.used_part || decision.usedPart}
                </div>
              </div>
            ) : (
              String(decision?.relevance || "").trim() ? (
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-blue-800">
                    Somut Olayla Bağlantı
                  </div>
                  <div className="mt-1 line-clamp-2 text-[11px] font-medium leading-5 text-slate-700">
                    {decision.relevance}
                  </div>
                </div>
              ) : null
            )}

            <button
              type="button"
              onClick={openDetail}
              className="mt-2 rounded-lg bg-white px-2.5 py-1 text-[10px] font-black text-blue-800 shadow-sm transition-all hover:bg-blue-100"
            >
              Detay Gör
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {decisionSlug ? (
            <a
              href={`/kararlar/${encodeURIComponent(decisionSlug)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Tam Karar Metnini Gör
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center text-[11px] font-bold text-slate-400 transition-colors"
            >
              Detay Yok
            </button>
          )}
          <button
            type="button"
            onClick={onToggleSave}
            className={`flex-1 rounded-xl px-2 py-2 text-center text-[11px] font-bold transition-all ${
              saved
                ? "bg-slate-800 text-white shadow-md hover:bg-slate-900"
                : "border border-blue-100 bg-blue-50 text-blue-800 hover:bg-blue-100"
            }`}
          >
            {primaryLabel}
          </button>
        </div>
      </div>

      {localDetailOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-800">
                    Karar Detayı
                  </div>
                  <h2 className="mt-2 text-xl font-black text-slate-950">
                    {decision.court || "Yargıtay Kararı"}
                  </h2>
                  {decision.code && (
                    <div className="mt-2 inline-flex rounded-xl bg-blue-700 px-3 py-1 text-xs font-black text-white shadow-sm">
                      {decision.code}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setLocalDetailOpen(false)}
                  className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm hover:bg-slate-50"
                >
                  Kapat
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6 custom-scrollbar">

              {String(decision?.used_part || decision?.usedPart || "").trim() && (
                <section className="mt-4 rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-blue-800">
                    Yararlanılan Kısım
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">
                    {decision.used_part || decision.usedPart}
                  </p>
                </section>
              )}

              {String(decision?.relevance || "").trim() && (
                <section className="mt-4 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                    Somut Olayla Bağlantı
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">
                    {decision.relevance}
                  </p>
                </section>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
