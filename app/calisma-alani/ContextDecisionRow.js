"use client";

import { getDecisionSlug } from "./workspace-utils";

export default function ContextDecisionRow({ decision, onOpenSummary }) {
  const slug = getDecisionSlug(decision);

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
      <div className="min-w-0">
        <div className="truncate text-xs font-black text-blue-800">
          {decision.code || "Esas/Karar no yok"}
        </div>
        {decision.court ? (
          <div className="mt-0.5 truncate text-[10px] font-bold text-slate-400">
            {decision.court}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {slug ? (
          <a
            href={`/kararlar/${encodeURIComponent(slug)}`}
            target="_blank"
            rel="noreferrer"
            title="Tam karar metnini gör"
            aria-label="Tam karar metnini gör"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </a>
        ) : null}

        <button
          type="button"
          onClick={onOpenSummary}
          title="AI özetini gör"
          aria-label="AI özetini gör"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 transition-all hover:bg-blue-100 hover:text-blue-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
