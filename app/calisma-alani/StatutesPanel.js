"use client";

import WorkspacePanel from "./WorkspacePanel";

export default function StatutesPanel({ vm }) {
  const { setActivePanel, aiStatutes } = vm;

  return (
    <WorkspacePanel id="statutes" title="Mevzuat" subtitle="Tespit edilen ilgili kanun maddeleri" setActivePanel={setActivePanel}>
      <div className="space-y-3 overflow-y-auto p-4 custom-scrollbar h-full">
        {aiStatutes.length ? aiStatutes.map((item) => {

          return (
            <div key={item.id} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-100 group-hover:bg-blue-500 transition-colors"></div>

              <div className="flex justify-between items-start mb-1 pl-2 gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900">{item.name}</div>
                  <div className="mt-2 text-[11px] font-medium text-slate-500">{item.note}</div>
                </div>

<div className="flex shrink-0 flex-col items-end gap-2">
  <div className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg">{item.article}</div>
</div>
              </div>
            </div>
          );
        }) : (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
            <span className="text-2xl mb-2 opacity-40">📚</span>
            <div className="text-xs font-bold text-slate-500">Henüz Consülto tarafından bulunan mevzuat yok.</div>
          </div>
        )}
      </div>
    </WorkspacePanel>
  );
}
