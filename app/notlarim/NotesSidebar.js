"use client";

import { useRef, useEffect, useState } from "react";
import { SECTION_COLORS, COLOR_KEYS } from "./notlarim-utils";

function ColorPicker({ noteId, currentColor, onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-full z-50 mt-1 flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl w-[116px]">
      {COLOR_KEYS.map(key => {
        const c = SECTION_COLORS[key];
        return (
          <button key={key} type="button" title={c.label}
            onClick={() => { onSelect(noteId, key); onClose(); }}
            className={`h-5 w-5 rounded-full ${c.dot} ring-2 ring-offset-1 transition-all hover:scale-110 ${currentColor === key ? "ring-slate-700" : "ring-transparent"}`}
          />
        );
      })}
    </div>
  );
}

function NoteRow({ note, isActive, vm }) {
  const { selectNote, renamingNoteId, setRenamingNoteId, renamingNoteValue, setRenamingNoteValue,
          handleRenameNote, handleDeleteNote, handleSetNoteColor, notes } = vm;
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const c          = SECTION_COLORS[note.color] ?? SECTION_COLORS.emerald;
  const isRenaming = renamingNoteId === note.id;
  const totalEntries = note.sections.reduce((sum, s) => sum + s.entries.length, 0);
  const lastSection  = note.sections[note.sections.length - 1];
  const lastEntry    = lastSection?.entries[lastSection.entries.length - 1];

  return (
    <div className="relative">
      <button type="button" onClick={() => selectNote(note.id)}
        className={`group w-full rounded-2xl p-3 text-left transition-all ${isActive ? "bg-slate-900 shadow-md" : "hover:bg-slate-100"}`}
      >
        <div className="flex items-center gap-2">
          <button type="button" title="Renk seç"
            onClick={e => { e.stopPropagation(); setColorPickerOpen(p => !p); }}
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.dot} ring-2 ring-offset-1 transition-all hover:scale-125 ${colorPickerOpen ? "ring-slate-400" : "ring-transparent"}`}
          />

          {isRenaming ? (
            <input value={renamingNoteValue} onChange={e => setRenamingNoteValue(e.target.value)}
              onBlur={() => handleRenameNote(note.id)}
              onKeyDown={e => {
                if (e.key === "Enter") handleRenameNote(note.id);
                if (e.key === "Escape") { setRenamingNoteId(null); setRenamingNoteValue(""); }
              }}
              autoFocus onClick={e => e.stopPropagation()}
              className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-900 outline-none ring-2 ring-slate-100"
            />
          ) : (
            <span className={`flex-1 min-w-0 truncate text-[12px] font-black ${isActive ? "text-white" : "text-slate-800"}`}>
              {note.title}
            </span>
          )}

          {totalEntries > 0 && (
            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>
              {totalEntries}
            </span>
          )}
        </div>

        {lastEntry && !isRenaming && (
          <p className={`mt-1.5 pl-[18px] text-[10px] leading-4 line-clamp-2 ${isActive ? "text-white/50" : "text-slate-400"}`}>
            {lastEntry.text}
          </p>
        )}

        {!isRenaming && (
          <div className={`mt-2 pl-[18px] flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 ${isActive ? "opacity-100" : ""}`}>
            <button type="button"
              onClick={e => { e.stopPropagation(); setRenamingNoteId(note.id); setRenamingNoteValue(note.title); }}
              className={`rounded-lg px-1.5 py-0.5 text-[9px] font-black ${isActive ? "bg-white/20 text-white hover:bg-white/30" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
            >
              Yeniden Adlandır
            </button>
            {notes.length > 1 && (
              <button type="button"
                onClick={e => { e.stopPropagation(); handleDeleteNote(note.id); }}
                className={`rounded-lg px-1.5 py-0.5 text-[9px] font-black ${isActive ? "bg-red-500/30 text-red-200 hover:bg-red-500/50" : "bg-red-50 text-red-500 hover:bg-red-100"}`}
              >
                Sil
              </button>
            )}
          </div>
        )}
      </button>

      {colorPickerOpen && (
        <ColorPicker noteId={note.id} currentColor={note.color} onSelect={handleSetNoteColor} onClose={() => setColorPickerOpen(false)} />
      )}
    </div>
  );
}

export default function NotesSidebar({ vm, drawer = false, onClose }) {
  const { notes, activeNoteId, isAddingNote, setIsAddingNote, addingNoteTitle, setAddingNoteTitle, handleAddNote } = vm;
  const addInputRef = useRef(null);
  useEffect(() => { if (isAddingNote) addInputRef.current?.focus(); }, [isAddingNote]);

  const body = (
    <>
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </div>
          <div className="leading-none">
            <div className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">Kişisel</div>
            <div className="mt-0.5 text-[13px] font-black tracking-tight text-slate-900">Notlarım</div>
          </div>
        </div>
        {drawer && (
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {notes.map(note => (
          <NoteRow key={note.id} note={note} isActive={note.id === activeNoteId} vm={vm} />
        ))}
      </div>

      <div className="mt-3 shrink-0">
        {isAddingNote ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
            <input ref={addInputRef} value={addingNoteTitle} onChange={e => setAddingNoteTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleAddNote();
                if (e.key === "Escape") { setIsAddingNote(false); setAddingNoteTitle(""); }
              }}
              placeholder="Not adı..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 placeholder:font-normal placeholder:text-slate-400"
            />
            <div className="mt-2 flex gap-1.5">
              <button type="button" onClick={handleAddNote} className="flex-1 rounded-xl bg-slate-900 py-1.5 text-[10px] font-black text-white hover:bg-slate-800">Ekle</button>
              <button type="button" onClick={() => { setIsAddingNote(false); setAddingNoteTitle(""); }} className="flex-1 rounded-xl border border-slate-200 bg-white py-1.5 text-[10px] font-black text-slate-500 hover:bg-slate-50">İptal</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setIsAddingNote(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 py-2.5 text-[11px] font-black text-slate-400 transition-all hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Yeni Not
          </button>
        )}
      </div>
    </>
  );

  if (drawer) {
    return (
      <div className="fixed inset-0 z-[200] xl:hidden">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
        <aside className="absolute inset-y-0 left-0 flex w-[78%] max-w-[260px] flex-col border-r border-slate-200 bg-white p-3 shadow-2xl animate-in slide-in-from-left duration-200">{body}</aside>
      </div>
    );
  }

  return (
    <aside className="relative z-20 hidden w-[220px] shrink-0 flex-col border-r border-slate-200 bg-white p-3 xl:flex">{body}</aside>
  );
}
