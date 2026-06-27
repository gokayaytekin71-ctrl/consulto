"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import NotlarimPanel from "./NotlarimPanel";
import { SECTION_COLORS } from "./notlarim-utils";

// ── Tarih etiketi ─────────────────────────────────────────────────────────────
function dateLabel(isoStr) {
  const d     = new Date(isoStr);
  const today = new Date();
  const yest  = new Date(today); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Bugün";
  if (d.toDateString() === yest.toDateString())  return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function groupByDate(entries) {
  const map = new Map();
  for (const e of entries) {
    const lbl = dateLabel(e.createdAt);
    if (!map.has(lbl)) map.set(lbl, []);
    map.get(lbl).push(e);
  }
  return [...map.entries()];
}

// ── Fosforlu renk paleti ───────────────────────────────────────────────────────
const HIGHLIGHT_COLORS = [
  { key: "yellow", bg: "#fef08a", label: "Sarı" },
  { key: "green",  bg: "#bbf7d0", label: "Yeşil" },
  { key: "blue",   bg: "#bae6fd", label: "Mavi" },
  { key: "pink",   bg: "#fbcfe8", label: "Pembe" },
  { key: "orange", bg: "#fed7aa", label: "Turuncu" },
];

const UNDERLINE_COLORS = [
  { key: "red",    color: "#ef4444", label: "Kırmızı" },
  { key: "blue",   color: "#3b82f6", label: "Mavi" },
  { key: "green",  color: "#22c55e", label: "Yeşil" },
  { key: "violet", color: "#8b5cf6", label: "Mor" },
];

// DOM tree walker ile karakter offset hesaplama
function getCharOffset(container, targetNode, offsetInNode) {
  let pos = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
  let node = walker.nextNode();
  while (node) {
    if (node === targetNode) return pos + offsetInNode;
    pos += node.textContent.length;
    node = walker.nextNode();
  }
  return pos;
}

// ── Annotasyonlu metin renderer ───────────────────────────────────────────────
function buildSegments(text, annotations) {
  if (!annotations || annotations.length === 0) return [{ text, annotation: null }];

  // Çakışmayan, start'a göre sıralı annotasyonlar
  const sorted = [...annotations]
    .filter(a => a.start >= 0 && a.end > a.start && a.end <= text.length)
    .sort((a, b) => a.start - b.start);

  const segments = [];
  let pos = 0;
  for (const ann of sorted) {
    if (ann.start > pos) segments.push({ text: text.slice(pos, ann.start), annotation: null });
    segments.push({ text: text.slice(ann.start, ann.end), annotation: ann });
    pos = ann.end;
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), annotation: null });
  return segments;
}

function AnnotatedText({ text, annotations, onRemoveAnnotation }) {
  const segments = buildSegments(text, annotations ?? []);
  return (
    <span>
      {segments.map((seg, i) => {
        if (!seg.annotation) return <span key={i}>{seg.text}</span>;
        const ann = seg.annotation;
        const isHighlight = ann.type === "highlight";
        const hlColor = HIGHLIGHT_COLORS.find(c => c.key === ann.color);
        const ulColor = UNDERLINE_COLORS.find(c => c.key === ann.color);
        const style = isHighlight
          ? { backgroundColor: hlColor?.bg ?? "#fef08a", borderRadius: "2px", padding: "0 1px" }
          : { textDecoration: "underline", textDecorationColor: ulColor?.color ?? "#3b82f6", textDecorationThickness: "2px" };
        return (
          <span
            key={i}
            style={style}
            className="cursor-pointer"
            title="Tıkla: vurguyu kaldır"
            onClick={e => { e.stopPropagation(); onRemoveAnnotation(ann.id); }}
          >
            {seg.text}
          </span>
        );
      })}
    </span>
  );
}

// ── Seçim araç çubuğu ─────────────────────────────────────────────────────────
function SelectionToolbar({ info, onApply, onClose }) {
  const [mode, setMode] = useState("highlight"); // "highlight" | "underline"
  return (
    <div
      className="absolute z-50 flex flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-xl"
      style={{ top: info.top, left: Math.max(8, info.left - 100), minWidth: 220 }}
      onMouseDown={e => e.preventDefault()}
    >
      {/* Mod seçici */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-0.5">
        <button
          type="button"
          onClick={() => setMode("highlight")}
          className={`flex-1 rounded-lg px-2 py-1 text-[10px] font-black transition-all ${mode === "highlight" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
        >
          Fosforlu
        </button>
        <button
          type="button"
          onClick={() => setMode("underline")}
          className={`flex-1 rounded-lg px-2 py-1 text-[10px] font-black transition-all ${mode === "underline" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
        >
          Altı Çizili
        </button>
      </div>

      {/* Renk seçici */}
      <div className="flex items-center gap-1.5">
        {mode === "highlight"
          ? HIGHLIGHT_COLORS.map(c => (
              <button
                key={c.key}
                type="button"
                title={c.label}
                onClick={() => onApply("highlight", c.key)}
                className="h-6 w-6 rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 ring-1 ring-slate-200"
                style={{ backgroundColor: c.bg }}
              />
            ))
          : UNDERLINE_COLORS.map(c => (
              <button
                key={c.key}
                type="button"
                title={c.label}
                onClick={() => onApply("underline", c.key)}
                className="h-6 w-6 rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 ring-1 ring-slate-200"
                style={{ backgroundColor: c.color }}
              />
            ))
        }
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Entry kartı ───────────────────────────────────────────────────────────────
function EntryCard({
  entry, color,
  onDelete, onToggleStar, onStartEdit,
  isEditing, editingValue, setEditingValue, onConfirmEdit, onCancelEdit,
  onAddAnnotation, onRemoveAnnotation,
}) {
  const editRef   = useRef(null);
  const textRef   = useRef(null);
  const cardRef   = useRef(null);
  const [copied,          setCopied]          = useState(false);
  const [expanded,        setExpanded]        = useState(false);
  const [selectionInfo,   setSelectionInfo]   = useState(null);

  useEffect(() => { if (isEditing) editRef.current?.focus(); }, [isEditing]);

  function copyText() {
    navigator.clipboard.writeText(entry.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelectionInfo(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const container = textRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) {
      setSelectionInfo(null);
      return;
    }
    const start = getCharOffset(container, range.startContainer, range.startOffset);
    const end   = getCharOffset(container, range.endContainer,   range.endOffset);
    if (start >= end) { setSelectionInfo(null); return; }

    const containerRect = container.getBoundingClientRect();
    const rangeRect     = range.getBoundingClientRect();

    setSelectionInfo({
      start, end,
      top:  rangeRect.top  - containerRect.top  - 82,
      left: rangeRect.left - containerRect.left + rangeRect.width / 2,
    });
  }

  function applyAnnotation(type, color) {
    if (!selectionInfo) return;
    onAddAnnotation({ start: selectionInfo.start, end: selectionInfo.end, type, color });
    setSelectionInfo(null);
    window.getSelection()?.removeAllRanges();
  }

  const isLong = entry.text.length > 280;
  const c = SECTION_COLORS[color] ?? SECTION_COLORS.emerald;
  const time = new Date(entry.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`group flex gap-3 ${entry.starred ? "relative" : ""}`}>
      {/* Yıldız */}
      <button
        type="button"
        onClick={onToggleStar}
        title={entry.starred ? "Yıldızı kaldır" : "Önemli işaretle"}
        className={`mt-1 shrink-0 transition-all ${entry.starred ? "text-amber-400 opacity-100" : "text-slate-200 opacity-0 group-hover:opacity-100 hover:text-amber-400"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={entry.starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>

      {/* Renkli çizgi */}
      <div className={`mt-1 w-0.5 shrink-0 self-stretch rounded-full transition-colors ${entry.starred ? "bg-amber-400" : `${c.dot} opacity-30 group-hover:opacity-70`}`} />

      {/* Kart */}
      <div
        ref={cardRef}
        className={`flex-1 min-w-0 rounded-2xl border bg-white px-4 py-3 shadow-sm transition-all group-hover:shadow-md ${entry.starred ? "border-amber-200 bg-amber-50/30" : "border-slate-100 group-hover:border-slate-200"}`}
      >
        {/* Üst satır */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-300">{time}</span>
            {entry.updatedAt && <span className="text-[9px] font-bold text-slate-300 italic">· düzenlendi</span>}
            {entry.starred && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700">Önemli</span>}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button type="button" onClick={onStartEdit} title="Düzenle"
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              </button>
              <button type="button" onClick={copyText} title="Kopyala"
                className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${copied ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
              >
                {copied
                  ? <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                }
              </button>
              <button type="button" onClick={onDelete} title="Sil"
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* İçerik */}
        {isEditing ? (
          <div>
            <textarea
              ref={editRef}
              value={editingValue}
              onChange={e => setEditingValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onConfirmEdit(); }
                if (e.key === "Escape") onCancelEdit();
              }}
              rows={3}
              className="custom-scrollbar w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-medium leading-6 text-slate-800 outline-none ring-2 ring-slate-100 focus:border-slate-400"
            />
            <div className="mt-2 flex gap-1.5">
              <button type="button" onClick={onConfirmEdit} className="rounded-xl bg-slate-900 px-3 py-1.5 text-[10px] font-black text-white hover:bg-slate-800">Kaydet</button>
              <button type="button" onClick={onCancelEdit}  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-500 hover:bg-slate-50">İptal</button>
            </div>
          </div>
        ) : (
          <div className="relative" onMouseUp={handleMouseUp}>
            {/* Seçim araç çubuğu */}
            {selectionInfo && (
              <SelectionToolbar
                info={selectionInfo}
                onApply={applyAnnotation}
                onClose={() => { setSelectionInfo(null); window.getSelection()?.removeAllRanges(); }}
              />
            )}
            <p
              ref={textRef}
              className={`select-text text-[12.5px] font-medium leading-6 text-slate-800 whitespace-pre-wrap break-words ${!expanded && isLong ? "line-clamp-4" : ""}`}
            >
              <AnnotatedText
                text={entry.text}
                annotations={entry.annotations}
                onRemoveAnnotation={annId => onRemoveAnnotation(annId)}
              />
            </p>
            {isLong && (
              <button type="button" onClick={() => setExpanded(p => !p)} className={`mt-1.5 text-[10px] font-black ${c.text} hover:underline`}>
                {expanded ? "Küçült" : "Devamını gör"}
              </button>
            )}
            {/* Fosfor ipucu — annotation var veya hover'da göster */}
            {(entry.annotations?.length > 0) && (
              <div className="mt-1.5 flex items-center gap-1">
                <span className="text-[9px] font-bold text-slate-400">
                  {entry.annotations.length} vurgu · metni seçerek yeni ekleyebilirsiniz
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sol bölüm kolonu ──────────────────────────────────────────────────────────
function SectionsColumn({ vm }) {
  const {
    activeNote, activeSectionId, setActiveSectionId,
    isAddingSection, setIsAddingSection,
    addingSectionTitle, setAddingSectionTitle, handleAddSection,
    renamingSectionId, setRenamingSectionId,
    renamingSectionValue, setRenamingSectionValue,
    handleRenameSection, handleDeleteSection,
  } = vm;

  const addRef = useRef(null);
  useEffect(() => { if (isAddingSection) addRef.current?.focus(); }, [isAddingSection]);

  const c = SECTION_COLORS[activeNote?.color] ?? SECTION_COLORS.emerald;

  const totalEntries = activeNote?.sections.reduce((s, sec) => s + sec.entries.length, 0) ?? 0;
  const totalWords   = activeNote?.sections.reduce((s, sec) =>
    s + sec.entries.reduce((ss, e) => ss + e.text.trim().split(/\s+/).filter(Boolean).length, 0), 0) ?? 0;

  return (
    <div className="flex w-[155px] shrink-0 flex-col border-r border-slate-100 bg-slate-50/40">
      {totalEntries > 0 && (
        <div className="flex items-center justify-around border-b border-slate-100 bg-white/60 px-2 py-2">
          <div className="text-center">
            <div className="text-[13px] font-black text-slate-700">{totalEntries}</div>
            <div className="text-[8px] font-bold uppercase tracking-wide text-slate-400">not</div>
          </div>
          <div className="h-6 w-px bg-slate-100" />
          <div className="text-center">
            <div className="text-[13px] font-black text-slate-700">{totalWords}</div>
            <div className="text-[8px] font-bold uppercase tracking-wide text-slate-400">kelime</div>
          </div>
          <div className="h-6 w-px bg-slate-100" />
          <div className="text-center">
            <div className="text-[13px] font-black text-slate-700">{(activeNote?.sections ?? []).length}</div>
            <div className="text-[8px] font-bold uppercase tracking-wide text-slate-400">bölüm</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Bölümler</span>
        <button type="button" onClick={() => { setIsAddingSection(true); setAddingSectionTitle(""); }} title="Bölüm ekle"
          className="flex h-5 w-5 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-2 space-y-0.5">
        {(activeNote?.sections ?? []).map(section => {
          const isActive   = section.id === activeSectionId;
          const isRenaming = renamingSectionId === section.id;
          const starCount  = section.entries.filter(e => e.starred).length;

          return (
            <div key={section.id} className="group relative">
              {isRenaming ? (
                <div className="px-1 py-1">
                  <input value={renamingSectionValue} onChange={e => setRenamingSectionValue(e.target.value)}
                    onBlur={() => handleRenameSection(section.id)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleRenameSection(section.id);
                      if (e.key === "Escape") { setRenamingSectionId(null); setRenamingSectionValue(""); }
                    }}
                    autoFocus
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-900 outline-none ring-2 ring-slate-100"
                  />
                </div>
              ) : (
                <button type="button" onClick={() => setActiveSectionId(section.id)}
                  className={`w-full flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-left transition-all ${
                    isActive ? `${c.light} ${c.text} font-black shadow-sm` : "text-slate-600 hover:bg-slate-100 font-semibold"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${isActive ? c.dot : "bg-slate-300"}`} />
                  <span className="flex-1 min-w-0 truncate text-[11px]">{section.title}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {starCount > 0 && <span className="text-[9px] text-amber-400">★{starCount}</span>}
                    {section.entries.length > 0 && (
                      <span className={`text-[9px] font-bold ${isActive ? c.text : "text-slate-400"}`}>
                        {section.entries.length}
                      </span>
                    )}
                  </div>
                </button>
              )}

              {!isRenaming && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-white/95 rounded-lg px-0.5 py-0.5 shadow-sm border border-slate-100">
                  <button type="button" onClick={() => { setRenamingSectionId(section.id); setRenamingSectionValue(section.title); }}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-slate-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                  {(activeNote?.sections?.length ?? 0) > 1 && (
                    <button type="button" onClick={() => handleDeleteSection(section.id)}
                      className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isAddingSection && (
          <div className="mt-1 px-1 space-y-1">
            <input ref={addRef} value={addingSectionTitle} onChange={e => setAddingSectionTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleAddSection();
                if (e.key === "Escape") { setIsAddingSection(false); setAddingSectionTitle(""); }
              }}
              placeholder="Bölüm adı..."
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[10px] font-bold text-slate-900 outline-none ring-2 ring-slate-100 placeholder:font-normal placeholder:text-slate-400"
            />
            <div className="flex gap-1">
              <button type="button" onClick={handleAddSection} className="flex-1 rounded-lg bg-slate-800 py-1 text-[9px] font-black text-white hover:bg-slate-900">Ekle</button>
              <button type="button" onClick={() => { setIsAddingSection(false); setAddingSectionTitle(""); }} className="flex-1 rounded-lg bg-slate-100 py-1 text-[9px] font-black text-slate-500">İptal</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ana panel ─────────────────────────────────────────────────────────────────
export default function NoteEditorPanel({ vm }) {
  const {
    activeNote, activeSection, activeSectionId,
    newEntryText, setNewEntryText, handleAddEntry,
    handleDeleteEntry, handleToggleStar,
    editingEntryId, setEditingEntryId, editingEntryValue, setEditingEntryValue, handleEditEntry,
    searchQuery, setSearchQuery, filteredEntries,
    handleAddAnnotation, handleRemoveAnnotation,
    setExpandedPanel,
  } = vm;

  const listRef     = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el || searchQuery) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [activeSection?.entries?.length, activeSectionId, searchQuery]);

  function submitEntry() {
    handleAddEntry();
    textareaRef.current?.focus();
  }

  function startEdit(entry) {
    setEditingEntryId(entry.id);
    setEditingEntryValue(entry.text);
  }

  const c = SECTION_COLORS[activeNote?.color] ?? SECTION_COLORS.emerald;

  if (!activeNote) {
    return (
      <NotlarimPanel title="Not Seçin" subtitle="Sol panelden bir not açın">
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <span className="text-4xl opacity-20">📝</span>
          <div className="text-xs font-bold text-slate-400">Sol panelden bir not seçin veya yeni not oluşturun.</div>
        </div>
      </NotlarimPanel>
    );
  }

  const starred      = filteredEntries.filter(e => e.starred);
  const normalGroups = groupByDate(filteredEntries.filter(e => !e.starred));

  const expandButton = (
    <button
      type="button"
      onClick={() => setExpandedPanel("editor")}
      className="rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-[10px] font-black text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
    >
      Büyüt
    </button>
  );

  return (
    <NotlarimPanel
      title={activeNote.title}
      subtitle={activeSection ? `${activeSection.title} · ${activeSection.entries.length} not` : "—"}
      accentStripe={c.stripe}
      accentDot={c.dot}
      actions={expandButton}
    >
      <div className="flex h-full min-h-0">
        <SectionsColumn vm={vm} />

        <div className="flex flex-1 min-w-0 flex-col">
          {/* Arama */}
          <div className="shrink-0 border-b border-slate-100 bg-white/60 px-4 py-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 transition-all focus-within:border-slate-300 focus-within:bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Bu bölümde ara…"
                className="flex-1 bg-transparent text-[12px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <>
                  <button type="button" onClick={() => setSearchQuery("")} className="shrink-0 text-slate-400 hover:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <span className="shrink-0 text-[10px] font-black text-slate-400">{filteredEntries.length} sonuç</span>
                </>
              )}
            </div>
          </div>

          {/* Entry listesi */}
          <div ref={listRef} className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <span className="text-3xl opacity-20">{searchQuery ? "🔍" : "✏️"}</span>
                <div className="text-xs font-bold text-slate-400">
                  {searchQuery ? `"${searchQuery}" için sonuç bulunamadı` : "Bu bölüme not ekleyin"}
                </div>
              </div>
            ) : (
              <>
                {starred.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[10px] font-black text-amber-500">★ Önemli</span>
                      <div className="h-px flex-1 bg-amber-100" />
                    </div>
                    <div className="space-y-3">
                      {starred.map(entry => (
                        <EntryCard
                          key={entry.id}
                          entry={entry}
                          color={activeNote.color}
                          onDelete={() => handleDeleteEntry(entry.id)}
                          onToggleStar={() => handleToggleStar(entry.id)}
                          onStartEdit={() => startEdit(entry)}
                          isEditing={editingEntryId === entry.id}
                          editingValue={editingEntryValue}
                          setEditingValue={setEditingEntryValue}
                          onConfirmEdit={() => handleEditEntry(entry.id, editingEntryValue)}
                          onCancelEdit={() => { setEditingEntryId(null); setEditingEntryValue(""); }}
                          onAddAnnotation={ann => handleAddAnnotation(entry.id, ann)}
                          onRemoveAnnotation={annId => handleRemoveAnnotation(entry.id, annId)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {normalGroups.map(([label, entries]) => (
                  <div key={label}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400">{label}</span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    <div className="space-y-3">
                      {entries.map(entry => (
                        <EntryCard
                          key={entry.id}
                          entry={entry}
                          color={activeNote.color}
                          onDelete={() => handleDeleteEntry(entry.id)}
                          onToggleStar={() => handleToggleStar(entry.id)}
                          onStartEdit={() => startEdit(entry)}
                          isEditing={editingEntryId === entry.id}
                          editingValue={editingEntryValue}
                          setEditingValue={setEditingEntryValue}
                          onConfirmEdit={() => handleEditEntry(entry.id, editingEntryValue)}
                          onCancelEdit={() => { setEditingEntryId(null); setEditingEntryValue(""); }}
                          onAddAnnotation={ann => handleAddAnnotation(entry.id, ann)}
                          onRemoveAnnotation={annId => handleRemoveAnnotation(entry.id, annId)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Giriş alanı */}
          <div className="shrink-0 border-t border-slate-100 bg-white p-3">
            <div className="flex items-end gap-2 rounded-2xl border-2 border-slate-100 bg-slate-50 px-3 py-2.5 transition-all focus-within:border-slate-300 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.03)]">
              <textarea
                ref={textareaRef}
                value={newEntryText}
                onChange={e => setNewEntryText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEntry(); } }}
                placeholder={activeSection ? `"${activeSection.title}" bölümüne not ekle… (Enter)` : "Bölüm seçin…"}
                disabled={!activeSection}
                rows={2}
                className="custom-scrollbar flex-1 resize-none bg-transparent text-[13px] font-medium leading-5 text-slate-800 outline-none placeholder:text-slate-400 min-h-[40px] max-h-[140px] disabled:opacity-50"
              />
              <button type="button" onClick={submitEntry} disabled={!newEntryText.trim() || !activeSection}
                className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-black text-white shadow-sm transition-all hover:bg-slate-700 hover:-translate-y-0.5 disabled:opacity-30 disabled:translate-y-0"
              >
                Ekle
              </button>
            </div>
            <p className="mt-1 px-1 text-[10px] font-bold text-slate-300">
              {newEntryText.length > 0
                ? `${newEntryText.length} karakter · ${newEntryText.trim().split(/\s+/).filter(Boolean).length} kelime`
                : "Metni seçerek fosforlu vurgu ekleyebilirsiniz · Shift+Enter yeni satır"}
            </p>
          </div>
        </div>
      </div>
    </NotlarimPanel>
  );
}
