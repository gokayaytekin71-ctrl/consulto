"use client";

import WorkspacePanel from "./WorkspacePanel";
import ExpandableNoteText from "./ExpandableNoteText";

export default function NotesPanel({ vm }) {
  const {
    setActivePanel,
    notes,
    isNoteExpanded,
    toggleNoteExpanded,
    handleDeleteNote,
    newNoteText, setNewNoteText,
    handleAddManualNote,
    activeWorkspaceId,
  } = vm;

  return (
    <WorkspacePanel id="notes" title="Strateji & Notlar" subtitle="Dosya içi hatırlatmalar" setActivePanel={setActivePanel}>
      <div className="flex h-full min-h-0 flex-col bg-slate-50/50">
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {notes.length ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                  <div className={`absolute inset-y-0 left-0 w-1 ${note.type === 'Risk' ? 'bg-red-500' : 'bg-gradient-to-b from-blue-900 to-blue-500'}`} />
                  <div className="pl-2">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest ${note.type === 'Risk' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-800'}`}>
                        {note.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="rounded-lg bg-slate-50 px-2 py-1 text-[9px] font-black text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                      >
                        Sil
                      </button>
                    </div>
                    <ExpandableNoteText
                      text={note.text}
                      expanded={isNoteExpanded(note.id)}
                      onToggle={() => toggleNoteExpanded(note.id)}
                      className="text-[11px] font-medium leading-5 text-slate-700"
                      buttonClassName="mt-2 rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-800 hover:bg-blue-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center">
              <span className="text-2xl mb-2 opacity-40">📝</span>
              <div className="text-xs font-bold text-slate-500">Henüz not yok</div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white p-3 z-10">
          <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-3 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]">
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Yeni not ekle..."
              className="min-h-[80px] w-full resize-none bg-transparent text-xs font-medium leading-5 text-slate-700 outline-none placeholder:text-slate-400 custom-scrollbar"
            />
            <div className="mt-2 flex items-center justify-between">
               <span className="text-[10px] font-bold text-slate-400">
                {newNoteText.trim().length} harf
              </span>
              <button
                type="button"
                onClick={handleAddManualNote}
                disabled={!newNoteText.trim() || !activeWorkspaceId}
                className="rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-black text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-40 hover:-translate-y-0.5"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      </div>
    </WorkspacePanel>
  );
}
