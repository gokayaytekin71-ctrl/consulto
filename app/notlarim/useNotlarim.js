"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DEFAULT_COLOR, nextColor } from "./notlarim-utils";

const STORAGE_KEY_V3 = "notlarim_v3";
const STORAGE_KEY_V2 = "notlarim_v2";

function makeEntry(text) {
  return {
    id: crypto.randomUUID(),
    text,
    starred: false,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
}
function makeSection(title = "Genel") {
  return { id: crypto.randomUUID(), title, entries: [] };
}
function makeNote(title = "Genel", color = DEFAULT_COLOR) {
  return { id: crypto.randomUUID(), title, color, sections: [makeSection("Genel")] };
}

function persist(data) {
  try { localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(data)); } catch {}
}

function load() {
  try {
    const raw3 = localStorage.getItem(STORAGE_KEY_V3);
    if (raw3) return JSON.parse(raw3);
    const raw2 = localStorage.getItem(STORAGE_KEY_V2);
    if (raw2) {
      const v2 = JSON.parse(raw2);
      if (v2?.noteSections?.length) {
        return {
          notes: v2.noteSections.map(s => ({
            id: s.id, title: s.title, color: s.color ?? DEFAULT_COLOR,
            sections: [{
              id: crypto.randomUUID(), title: "Genel",
              entries: (s.notes ?? []).map(n => ({ id: n.id, text: n.text, starred: false, createdAt: n.createdAt, updatedAt: null })),
            }],
          })),
          decisions: v2.decisions ?? [],
          statutes:  v2.statutes  ?? [],
        };
      }
    }
    return null;
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function useNotlarim() {
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";

  const [hasMounted, setHasMounted]           = useState(false);
  const [syncStatus, setSyncStatus]           = useState("idle"); // idle | saving | saved | error
  const [isMobile,   setIsMobile]             = useState(false);
  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileTab,  setMobileTab]            = useState("editor");

  const [notes,           setNotes]           = useState([]);
  const [activeNoteId,    setActiveNoteId]    = useState(null);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [newEntryText,    setNewEntryText]    = useState("");

  // Not (sidebar) formaları
  const [isAddingNote,    setIsAddingNote]    = useState(false);
  const [addingNoteTitle, setAddingNoteTitle] = useState("");
  const [renamingNoteId,    setRenamingNoteId]    = useState(null);
  const [renamingNoteValue, setRenamingNoteValue] = useState("");

  // Bölüm formaları
  const [isAddingSection,    setIsAddingSection]    = useState(false);
  const [addingSectionTitle, setAddingSectionTitle] = useState("");
  const [renamingSectionId,    setRenamingSectionId]    = useState(null);
  const [renamingSectionValue, setRenamingSectionValue] = useState("");

  // Entry düzenleme
  const [editingEntryId,    setEditingEntryId]    = useState(null);
  const [editingEntryValue, setEditingEntryValue] = useState("");

  // Arama
  const [searchQuery, setSearchQuery] = useState("");

  // Kararlar
  const [decisions,        setDecisions]        = useState([]);
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [decisionForm,     setDecisionForm]     = useState({ title: "", court: "", date: "", uyusmazlik: "", gerekce: "", sonuc: "", personalNote: "", aiSummary: "", sourceUrl: "", fromLink: false });

  // Mevzuat
  const [statutes,        setStatutes]        = useState([]);
  const [showStatuteForm, setShowStatuteForm] = useState(false);
  const [statuteForm,     setStatuteForm]     = useState({ name: "", article: "", note: "" });

  const [visiblePanels, setVisiblePanels] = useState({ kararlar: true, mevzuat: true });

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStatus === "loading") return; // session henüz yüklenmedi, bekle

    async function bootstrap() {
      let data = null;

      // Oturum açıksa önce API'den dene
      if (isAuthenticated) {
        try {
          const res = await fetch("/api/notlarim/defter");
          if (res.ok) data = await res.json();
        } catch {}
      }

      // API'den gelen yoksa localStorage'a bak
      if (!data) data = load();

      let ns   = data?.notes     ?? [];
      const ds = data?.decisions ?? [];
      const ss = data?.statutes  ?? [];

      if (ns.length === 0) ns = [makeNote("Genel", DEFAULT_COLOR)];
      // starred / updatedAt backfill
      ns = ns.map(n => ({
        ...n,
        sections: n.sections.map(s => ({
          ...s,
          entries: s.entries.map(e => ({ starred: false, updatedAt: null, ...e })),
        })),
      }));

      setNotes(ns);
      setActiveNoteId(ns[0].id);
      setActiveSectionId(ns[0].sections[0]?.id ?? null);
      setDecisions(ds);
      setStatutes(ss);

      const check = () => setIsMobile(window.innerWidth < 1280);
      check();
      window.addEventListener("resize", check);
      setHasMounted(true);

      return () => window.removeEventListener("resize", check);
    }

    bootstrap();
  }, [sessionStatus, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasMounted) return;

    // Her zaman localStorage'a yaz (offline fallback)
    persist({ notes, decisions, statutes });

    // Oturum açıksa API'ye de kaydet (1.5 sn debounce)
    if (!isAuthenticated) return;

    setSyncStatus("saving");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/notlarim/defter", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes, decisions, statutes }),
        });
        setSyncStatus(res.ok ? "saved" : "error");
      } catch {
        setSyncStatus("error");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [notes, decisions, statutes, hasMounted, isAuthenticated]);

  // ── Türetilenler ──────────────────────────────────────────────────────────
  const activeNote    = notes.find(n => n.id === activeNoteId)    ?? null;
  const activeSection = activeNote?.sections.find(s => s.id === activeSectionId) ?? null;

  // Arama filtresi (aktif bölüm + tüm bölümler arası)
  const filteredEntries = (() => {
    if (!activeSection) return [];
    if (!searchQuery.trim()) return activeSection.entries;
    const q = searchQuery.toLowerCase();
    return activeSection.entries.filter(e => e.text.toLowerCase().includes(q));
  })();

  // Not seçilince ilk bölümü aç
  const selectNote = useCallback((noteId) => {
    setActiveNoteId(noteId);
    const note = notes.find(n => n.id === noteId);
    if (note?.sections[0]) setActiveSectionId(note.sections[0].id);
    setNewEntryText("");
    setSearchQuery("");
    setEditingEntryId(null);
  }, [notes]);

  // ── Entry işlemleri ────────────────────────────────────────────────────────
  const updateEntries = useCallback((updater) => {
    setNotes(prev => prev.map(n =>
      n.id !== activeNoteId ? n : {
        ...n,
        sections: n.sections.map(s =>
          s.id !== activeSectionId ? s : { ...s, entries: updater(s.entries) }
        ),
      }
    ));
  }, [activeNoteId, activeSectionId]);

  const handleAddEntry = useCallback(() => {
    if (!newEntryText.trim() || !activeNoteId || !activeSectionId) return;
    updateEntries(entries => [...entries, makeEntry(newEntryText.trim())]);
    setNewEntryText("");
  }, [newEntryText, activeNoteId, activeSectionId, updateEntries]);

  const handleDeleteEntry = useCallback((entryId) => {
    updateEntries(entries => entries.filter(e => e.id !== entryId));
  }, [updateEntries]);

  const handleEditEntry = useCallback((entryId, newText) => {
    if (!newText.trim()) return;
    updateEntries(entries =>
      entries.map(e => e.id === entryId ? { ...e, text: newText.trim(), updatedAt: new Date().toISOString() } : e)
    );
    setEditingEntryId(null);
    setEditingEntryValue("");
  }, [updateEntries]);

  const handleToggleStar = useCallback((entryId) => {
    updateEntries(entries =>
      entries.map(e => e.id === entryId ? { ...e, starred: !e.starred } : e)
    );
  }, [updateEntries]);

  // ── Not (sidebar) işlemleri ───────────────────────────────────────────────
  const handleAddNote = useCallback(() => {
    if (!addingNoteTitle.trim()) return;
    const usedColors = notes.map(n => n.color);
    const note = makeNote(addingNoteTitle.trim(), nextColor(usedColors));
    setNotes(prev => [...prev, note]);
    setActiveNoteId(note.id);
    setActiveSectionId(note.sections[0].id);
    setAddingNoteTitle("");
    setIsAddingNote(false);
  }, [addingNoteTitle, notes]);

  const handleRenameNote = useCallback((id) => {
    if (!renamingNoteValue.trim()) { setRenamingNoteId(null); return; }
    setNotes(prev => prev.map(n => n.id === id ? { ...n, title: renamingNoteValue.trim() } : n));
    setRenamingNoteId(null);
    setRenamingNoteValue("");
  }, [renamingNoteValue]);

  const handleDeleteNote = useCallback((id) => {
    setNotes(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter(n => n.id !== id);
      if (activeNoteId === id) {
        setActiveNoteId(next[0].id);
        setActiveSectionId(next[0].sections[0]?.id ?? null);
      }
      return next;
    });
  }, [activeNoteId]);

  const handleSetNoteColor = useCallback((noteId, color) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, color } : n));
  }, []);

  // ── Bölüm işlemleri ───────────────────────────────────────────────────────
  const handleAddSection = useCallback(() => {
    if (!addingSectionTitle.trim() || !activeNoteId) return;
    const section = makeSection(addingSectionTitle.trim());
    setNotes(prev => prev.map(n =>
      n.id !== activeNoteId ? n : { ...n, sections: [...n.sections, section] }
    ));
    setActiveSectionId(section.id);
    setAddingSectionTitle("");
    setIsAddingSection(false);
  }, [addingSectionTitle, activeNoteId]);

  const handleRenameSection = useCallback((id) => {
    if (!renamingSectionValue.trim()) { setRenamingSectionId(null); return; }
    setNotes(prev => prev.map(n =>
      n.id !== activeNoteId ? n : {
        ...n,
        sections: n.sections.map(s => s.id === id ? { ...s, title: renamingSectionValue.trim() } : s),
      }
    ));
    setRenamingSectionId(null);
    setRenamingSectionValue("");
  }, [renamingSectionValue, activeNoteId]);

  const handleDeleteSection = useCallback((id) => {
    setNotes(prev => prev.map(n => {
      if (n.id !== activeNoteId) return n;
      if (n.sections.length <= 1) return n;
      const next = n.sections.filter(s => s.id !== id);
      if (activeSectionId === id) setActiveSectionId(next[0].id);
      return { ...n, sections: next };
    }));
  }, [activeNoteId, activeSectionId]);

  const togglePanel = useCallback((key) => {
    setVisiblePanels(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Karar ─────────────────────────────────────────────────────────────────
  const handleAddDecision = useCallback(() => {
    if (!decisionForm.title.trim()) return;
    setDecisions(prev => [{ id: crypto.randomUUID(), ...decisionForm, createdAt: new Date().toISOString() }, ...prev]);
    setDecisionForm({ title: "", court: "", date: "", uyusmazlik: "", gerekce: "", sonuc: "", personalNote: "", aiSummary: "", sourceUrl: "", fromLink: false });
    setShowDecisionForm(false);
  }, [decisionForm]);

  const handleAddDecisionDirect = useCallback((data) => {
    setDecisions(prev => [{ id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() }, ...prev]);
    setShowDecisionForm(false);
  }, []);

  const handleDeleteDecision = useCallback((id) => setDecisions(prev => prev.filter(d => d.id !== id)), []);

  // ── Mevzuat ───────────────────────────────────────────────────────────────
  const handleAddStatute = useCallback(() => {
    if (!statuteForm.name.trim()) return;
    setStatutes(prev => [{ id: crypto.randomUUID(), ...statuteForm, createdAt: new Date().toISOString() }, ...prev]);
    setStatuteForm({ name: "", article: "", note: "" });
    setShowStatuteForm(false);
  }, [statuteForm]);
  const handleDeleteStatute = useCallback((id) => setStatutes(prev => prev.filter(s => s.id !== id)), []);

  return {
    hasMounted, isMobile, isAuthenticated, syncStatus,
    sidebarOpen, setSidebarOpen,
    mobileSidebarOpen, setMobileSidebarOpen,
    mobileTab, setMobileTab,
    visiblePanels, togglePanel,

    notes, activeNoteId, activeNote, selectNote,
    isAddingNote, setIsAddingNote, addingNoteTitle, setAddingNoteTitle, handleAddNote,
    renamingNoteId, setRenamingNoteId, renamingNoteValue, setRenamingNoteValue, handleRenameNote,
    handleDeleteNote, handleSetNoteColor,

    activeSectionId, setActiveSectionId, activeSection,
    isAddingSection, setIsAddingSection, addingSectionTitle, setAddingSectionTitle, handleAddSection,
    renamingSectionId, setRenamingSectionId, renamingSectionValue, setRenamingSectionValue,
    handleRenameSection, handleDeleteSection,

    newEntryText, setNewEntryText, handleAddEntry, handleDeleteEntry,
    editingEntryId, setEditingEntryId, editingEntryValue, setEditingEntryValue, handleEditEntry,
    handleToggleStar,
    searchQuery, setSearchQuery, filteredEntries,

    decisions, showDecisionForm, setShowDecisionForm, decisionForm, setDecisionForm,
    handleAddDecision, handleAddDecisionDirect, handleDeleteDecision,
    statutes, showStatuteForm, setShowStatuteForm, statuteForm, setStatuteForm,
    handleAddStatute, handleDeleteStatute,
  };
}
