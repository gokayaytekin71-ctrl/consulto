"use client";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useAnalysisBot } from "../hooks/useAnalysisBot";
import TokenBalance from "@/components/TokenBalance";
import { useTheme } from "@/app/context/ThemeContext";
import { pdf } from "@react-pdf/renderer";
import AnalysisPDFDocument from "@/components/AnalysisPDFDocument";
import { saveAs } from "file-saver";

/* ============================================================
   CONSULTO · Analiz AI
   Modern "editöryel hukuk" arayüzü
   Krem/ivory + lacivert + altın aksan · Serif başlıklar
   ============================================================ */

// ---- Tema yardımcıları (tek kaynaktan renkler) ----
const T = (dark) => ({
  // yüzeyler
  appBg:        dark ? "bg-[#0A0F1C]"            : "bg-[#F3EDE1]",
  surface:      dark ? "bg-[#101626]"            : "bg-[#FBF7EE]",
  surfaceAlt:   dark ? "bg-[#0D1322]"            : "bg-white",
  raised:       dark ? "bg-[#16203A]"            : "bg-white",
  // çizgiler
  line:         dark ? "border-white/10"         : "border-[#E4DAC6]",
  lineSoft:     dark ? "border-white/5"          : "border-[#ECE3D2]",
  // metin
  ink:          dark ? "text-slate-100"          : "text-[#1C2A47]",
  inkSoft:      dark ? "text-slate-400"          : "text-[#5B6478]",
  inkMute:      dark ? "text-slate-500"          : "text-[#8A8270]",
  // marka / aksan
  navy:         dark ? "text-amber-300"          : "text-[#1C2A47]",
  gold:         dark ? "text-amber-400"          : "text-[#A77B2E]",
  goldBg:       dark ? "bg-amber-400/10"         : "bg-[#F2E7CC]",
  goldBorder:   dark ? "border-amber-400/30"     : "border-[#DCC68C]",
});

// 1. Loader — sakin, ölçülü "işleniyor" durumu
const CyberLoader = ({ isDarkMode }) => {
  const c = T(isDarkMode);
  const [msgIndex, setMsgIndex] = useState(0);
  const messages = [
    "SİSTEM BAŞLATILIYOR",
    "MEVZUAT VERİ TABANI TARANIYOR",
    "YARGITAY İÇTİHATLARI EŞLEŞTİRİLİYOR",
    "SEMANTİK ANALİZ YAPILIYOR",
    "HUKUKİ GÖRÜŞ OLUŞTURULUYOR",
  ];

  useEffect(() => {
    const interval = setInterval(() => setMsgIndex((p) => (p + 1) % messages.length), 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full rounded-2xl border ${c.line} ${c.surface} backdrop-blur-sm`}>
      <div className="relative w-14 h-14">
        <div className={`absolute inset-0 rounded-full border-2 ${isDarkMode ? "border-white/10" : "border-[#E4DAC6]"}`}></div>
        <div className={`absolute inset-0 rounded-full border-t-2 animate-spin ${isDarkMode ? "border-amber-400" : "border-[#1C2A47]"}`}></div>
        <div className={`absolute inset-2 rounded-full border-b-2 animate-spin-slow ${isDarkMode ? "border-amber-400/40" : "border-[#A77B2E]/50"}`}></div>
      </div>
      <div className="mt-6 flex flex-col items-center gap-2 text-center px-4">
        <span className={`text-[11px] font-serif italic ${c.gold}`}>Consulto çalışıyor</span>
        <span className={`text-[10px] font-mono tracking-[0.18em] ${c.inkSoft} animate-pulse`}>{messages[msgIndex]}…</span>
      </div>
      <div className={`w-44 h-px mt-5 overflow-hidden ${isDarkMode ? "bg-white/10" : "bg-[#E4DAC6]"}`}>
        <div className={`h-full w-1/2 animate-shimmer ${isDarkMode ? "bg-amber-400" : "bg-[#1C2A47]"}`}></div>
      </div>
    </div>
  );
};

// 2. Editöryel kart — ince çerçeve, üst başlık şeridi, serif kimlik
const PremiumCard = ({ title, eyebrow, icon, children, className = "", noPadding = false, action, isDarkMode }) => {
  const c = T(isDarkMode);
  return (
    <section className={`relative flex flex-col rounded-2xl border ${c.line} ${c.surface} overflow-hidden transition-shadow duration-300 ${isDarkMode ? "shadow-xl shadow-black/30" : "shadow-[0_1px_0_#fff_inset,0_8px_30px_-18px_rgba(28,42,71,0.35)]"} h-full ${className}`}>
      {(title || icon || action) && (
        <header className={`flex-none flex items-center justify-between px-5 py-3.5 border-b ${c.lineSoft} ${isDarkMode ? "bg-white/[0.02]" : "bg-[#F6EFE2]"}`}>
          <div className="flex items-center gap-3 min-w-0">
            {icon && <span className={`${c.gold} shrink-0`}>{icon}</span>}
            <div className="min-w-0">
              {eyebrow && <span className={`block text-[9px] font-mono tracking-[0.22em] uppercase ${c.inkMute}`}>{eyebrow}</span>}
              {title && <h3 className={`text-sm font-serif font-semibold leading-tight truncate ${c.ink}`}>{title}</h3>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={`flex-1 min-h-0 relative flex flex-col ${noPadding ? "" : "p-5"}`}>{children}</div>
    </section>
  );
};

// 3. Mevzuat Popover — kağıt yüzeyli alıntı kutusu
const MevzuatPopover = ({ data, position, onClose, isDarkMode }) => {
  const c = T(isDarkMode);
  if (!data || !position) return null;
  return (
    <div
      data-mevzuat-popover="1"
      className={`fixed z-[9999] w-[450px] max-w-[90vw] flex flex-col rounded-2xl border ${c.line} ${c.surfaceAlt} ${c.ink} shadow-2xl ${isDarkMode ? "shadow-black/60" : "shadow-[0_24px_60px_-20px_rgba(28,42,71,0.45)]"} animate-in fade-in zoom-in-95 duration-200`}
      style={{ top: position.top, left: position.left, transform: "translate(-50%, 0)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`flex items-center justify-between px-4 py-3 border-b ${c.lineSoft} ${isDarkMode ? "bg-white/[0.03]" : "bg-[#F6EFE2]"} rounded-t-2xl`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-1.5 h-4 rounded-full ${isDarkMode ? "bg-amber-400" : "bg-[#A77B2E]"}`}></span>
          <span className={`text-xs font-serif font-semibold truncate ${c.navy}`}>
            {data.mevzuat_adi} {data.madde ? <span className="font-mono text-[11px]">m.{data.madde}</span> : ""}
          </span>
        </div>
        <button onClick={onClose} className={`p-1 rounded-md transition-colors ${isDarkMode ? "hover:bg-white/10 text-slate-400 hover:text-white" : "hover:bg-[#E4DAC6] text-[#5B6478] hover:text-[#1C2A47]"}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar">
        <div className={`text-[13px] leading-relaxed font-sans whitespace-pre-wrap ${c.ink}`}>{data.preview}</div>
      </div>
    </div>
  );
};

// --- Ana Sayfa ---
export default function AnalysisPage() {
  const {
    chats, activeId, setActiveId, input, setInput, isLoading, search, setSearch,
    confirmDel, setConfirmDel, openMevzuat, setOpenMevzuat,
    active, filteredChats, activeMarkdown, activeUserQuery,
    handleAnalyze, deleteChatById, createEmptyAnalysis, calcMevzuatPopover, getMevzuatPreview,
    utils,
  } = useAnalysisBot();

  const { isDarkMode, toggleTheme } = useTheme();
  const c = T(isDarkMode);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [openSections, setOpenSections] = useState({ mevzuat: true, kararlar: true });
  const [isDownloading, setIsDownloading] = useState(false);

  const toggleSection = (section) => setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  const handleSelectChat = (id) => { setActiveId(id); setMobileMenuOpen(false); };
  const onDeleteClick = (e, id) => { e?.stopPropagation(); if (id) setConfirmDel({ open: true, id }); };

  useEffect(() => { if (mobileMenuOpen) setMobileResourcesOpen(false); }, [mobileMenuOpen]);
  useEffect(() => { if (mobileResourcesOpen) setMobileMenuOpen(false); }, [mobileResourcesOpen]);

  // PDF İNDİRME
  const handleDownloadPDF = async () => {
    if (!active || !activeMarkdown) return;
    setIsDownloading(true);
    try {
      const blob = await pdf(
        <AnalysisPDFDocument
          subject={activeUserQuery || active.title || "Hukuki Analiz"}
          content={activeMarkdown}
          date={active.createdAt}
          decisions={active.sources?.kararlar}
        />
      ).toBlob();

      const safeName = (active.title || "analiz").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      saveAs(blob, `consulto_${safeName}.pdf`);
    } catch (err) {
      console.error("PDF Hatası:", err);
      alert("Hata oluştu.");
    } finally {
      setIsDownloading(false);
    }
  };

  const icons = {
    send: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 5l7 7-7 7M3 12h17" /></svg>,
    plus: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" /></svg>,
    trash: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    book: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    scale: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
    menu: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" /></svg>,
    close: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    chevronDown: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    chevronUp: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
    download: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
    sun: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    moon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-4rem)] font-sans overflow-hidden transition-colors duration-500 ${c.appBg} ${c.ink} ${isDarkMode ? "selection:bg-amber-400/30 selection:text-amber-100" : "selection:bg-[#1C2A47]/15 selection:text-[#1C2A47]"}`}>

      <style jsx global>{`
        footer, .footer { display: none !important; }
        .font-serif { font-family: 'Georgia', 'Iowan Old Style', 'Times New Roman', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? "#26324c" : "#d8cbb1"}; border-radius: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? "#33415f" : "#c2b290"}; }
        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(-360deg); } }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }
        @keyframes shimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(240%); } }
        .animate-shimmer { animation: shimmer 1.6s infinite ease-in-out; }
        .paper-grain {
          background-image: radial-gradient(${isDarkMode ? "rgba(255,255,255,0.015)" : "rgba(28,42,71,0.025)"} 1px, transparent 1px);
          background-size: 22px 22px;
        }
      `}</style>

      {/* Arkaplan dokusu */}
      <div className="fixed inset-0 z-0 pointer-events-none paper-grain"></div>

      {/* Mobil: menu + kaynak + tema butonları (masaüstünde gizli) */}
      <div className={`flex-none flex items-center justify-between px-3 py-2 md:hidden ${mobileMenuOpen || mobileResourcesOpen ? "hidden" : "flex"}`}>
        <button
          onClick={() => setMobileMenuOpen((p) => !p)}
          className={`p-2 rounded-lg ${isDarkMode ? "text-white/70 hover:text-white hover:bg-white/10" : "text-[#5B6478] hover:text-[#1C2A47] hover:bg-black/[0.06]"}`}
        >
          {icons.menu}
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "text-white/60 hover:text-amber-300 hover:bg-white/10" : "text-[#5B6478] hover:text-[#A77B2E] hover:bg-black/[0.06]"}`}
            title={isDarkMode ? "Açık Mod" : "Koyu Mod"}
          >
            {isDarkMode ? icons.sun : icons.moon}
          </button>
          <button
            onClick={() => setMobileResourcesOpen((p) => !p)}
            className={`p-2 rounded-lg ${isDarkMode ? "text-amber-300/80 hover:bg-white/10" : "text-[#A77B2E] hover:bg-black/[0.06]"}`}
            aria-label="Kaynaklar"
          >
            {icons.book}
          </button>
        </div>
      </div>

      {/* ====================== MAIN LAYOUT ====================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full flex-1 min-h-0 overflow-hidden relative z-10 px-3 md:px-6 pt-4 pb-5">

        {(mobileMenuOpen || mobileResourcesOpen) && (
          <div
            className="fixed inset-x-0 bottom-0 top-0 z-[55] bg-black/70 backdrop-blur-md md:hidden"
            onClick={() => { setMobileMenuOpen(false); setMobileResourcesOpen(false); }}
          />
        )}

        {/* SOL: Geçmiş Analizler */}
        <aside
          className={`md:col-span-3 lg:col-span-3 flex flex-col h-full min-h-0
            fixed top-0 bottom-0 left-0 z-[80] w-[85vw] max-w-[330px] shadow-2xl md:shadow-none
            transform transition-transform duration-300 ease-in-out md:static md:transform-none md:w-auto
            ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            ${isDarkMode ? "bg-[#0A0F1C] md:bg-transparent" : "bg-[#F3EDE1] md:bg-transparent"} pt-4 md:pt-0`}
        >
          <div className={`md:hidden flex items-center justify-between px-4 py-3 border-b ${c.lineSoft}`}>
            <h2 className={`text-sm font-serif font-semibold ${c.ink}`}>Geçmiş Analizler</h2>
            <button onClick={() => setMobileMenuOpen(false)} className={c.inkSoft}>{icons.close}</button>
          </div>

          <PremiumCard className="h-full" noPadding isDarkMode={isDarkMode} eyebrow="Arşiv" title="Geçmiş Analizler" icon={icons.book}>
            <div className="flex flex-col h-full overscroll-contain">

              <div className="pt-4">
                <TokenBalance />
              </div>

              <div className="px-4 pb-4 space-y-3 flex-none">
                {/* Yeni Analiz */}
                <button
                  onClick={() => { const newChat = createEmptyAnalysis(""); setActiveId(newChat.id); setMobileMenuOpen(false); }}
                  className={`group relative w-full flex items-center justify-center gap-2 overflow-hidden text-sm font-semibold py-3 rounded-xl border transition-all duration-300
                    ${isDarkMode
                      ? "bg-amber-400/10 border-amber-400/30 text-amber-200 hover:bg-amber-400/20 hover:border-amber-400/50"
                      : "bg-[#16223E] border-[#16223E] text-white hover:bg-[#1f2f54] shadow-[0_8px_20px_-10px_rgba(28,42,71,0.7)]"}`}
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
                  {icons.plus} <span className="tracking-wide">Yeni Analiz Başlat</span>
                </button>

                {/* Arama */}
                <div className="relative">
                  <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${c.inkMute}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
                  <input
                    type="text"
                    placeholder="Analizlerde ara…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full rounded-lg py-2.5 pl-9 pr-3 text-xs border transition-all focus:outline-none focus:ring-2
                      ${isDarkMode
                        ? "bg-[#0D1322] border-white/10 text-slate-200 placeholder:text-slate-600 focus:border-amber-400/40 focus:ring-amber-400/10"
                        : "bg-white border-[#E4DAC6] text-[#1C2A47] placeholder:text-[#A8A08C] focus:border-[#A77B2E] focus:ring-[#A77B2E]/15"}`}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-20 custom-scrollbar">
                <div className="space-y-1.5">
                  {filteredChats.map((item) => {
                    const isActive = item.id === activeId;
                    const title = utils.cleanTitle(item.title) || (item.messages?.find((m) => m.sender === "user")?.text || "Başlıksız");
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectChat(item.id)}
                        className={`group relative pl-4 pr-3 py-3 rounded-xl cursor-pointer transition-all duration-200 border
                          ${isActive
                            ? (isDarkMode ? "bg-white/[0.04] border-amber-400/30" : "bg-white border-[#DCC68C] shadow-[0_6px_18px_-12px_rgba(28,42,71,0.4)]")
                            : "border-transparent " + (isDarkMode ? "hover:bg-white/[0.03] hover:border-white/10" : "hover:bg-white/70 hover:border-[#ECE3D2]")}`}
                      >
                        {/* aktif sol şerit */}
                        <span className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full transition-opacity ${isActive ? "opacity-100" : "opacity-0"} ${isDarkMode ? "bg-amber-400" : "bg-[#A77B2E]"}`}></span>
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-[13px] font-medium truncate mb-1 ${isActive ? c.navy : c.inkSoft} group-hover:${isDarkMode ? "text-slate-200" : "text-[#1C2A47]"}`}>{title}</h4>
                            <span className={`text-[10px] font-mono ${c.inkMute}`}>{new Date(item.createdAt || Date.now()).toLocaleDateString("tr-TR")}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => onDeleteClick(e, item.id)}
                          className={`absolute right-2 bottom-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10 ${isDarkMode ? "text-slate-500 hover:text-red-400 hover:bg-red-900/20" : "text-[#8A8270] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200"}`}
                        >
                          {icons.trash}
                        </button>
                      </div>
                    );
                  })}
                  {!filteredChats.length && (
                    <div className={`px-4 py-10 text-center text-xs ${c.inkMute}`}>Henüz analiz yok.</div>
                  )}
                </div>
              </div>
            </div>
          </PremiumCard>
        </aside>

        {/* ORTA: Chat & Analiz */}
        <main
          className={`md:col-span-9 lg:col-span-6 flex flex-col h-full min-h-0 overflow-y-auto custom-scrollbar bg-transparent z-10
            ${(mobileMenuOpen || mobileResourcesOpen) ? "hidden md:flex" : "flex"}`}
        >
          <div className="flex flex-col gap-5 pb-16">

            {/* Soru Alanı — "danışma masası" */}
            <PremiumCard isDarkMode={isDarkMode} eyebrow="Danışma" title="Hukuki Mesele" icon={icons.scale}>
              <form onSubmit={handleAnalyze} className="relative">
                <textarea
                  disabled={isLoading}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Hukuki meseleyi, dava türünü ve delil durumunu buraya detaylıca yazın…"
                  className={`w-full rounded-xl p-4 min-h-[130px] text-sm leading-relaxed border transition-all resize-y max-h-[40vh] md:max-h-none focus:outline-none focus:ring-2
                    ${isDarkMode
                      ? "bg-[#0D1322] border-white/10 text-slate-200 placeholder:text-slate-600 focus:border-amber-400/40 focus:ring-amber-400/10"
                      : "bg-white border-[#E4DAC6] text-[#1C2A47] placeholder:text-[#A8A08C] focus:border-[#A77B2E] focus:ring-[#A77B2E]/15"}
                    ${isLoading ? "opacity-30 pointer-events-none" : ""}`}
                />

                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <CyberLoader isDarkMode={isDarkMode} />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3 sm:gap-0">
                  <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {["YARGITAY", "MEVZUAT"].map((tag) => (
                      <span key={tag} className={`text-[9px] font-mono tracking-wider px-2.5 py-1 rounded-full border whitespace-nowrap ${c.goldBg} ${c.goldBorder} ${c.gold}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-end items-center">
                    {input && !isLoading && (
                      <button type="button" onClick={() => setInput("")} className={`px-3 py-2 text-xs font-medium transition-colors ${c.inkSoft} hover:${isDarkMode ? "text-slate-300" : "text-[#1C2A47]"}`}>Vazgeç</button>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className={`group relative inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold tracking-wide rounded-xl shadow-lg disabled:opacity-40 disabled:shadow-none transition-all duration-300 overflow-hidden
                        ${isDarkMode
                          ? "bg-amber-400 text-[#0A0F1C] hover:bg-amber-300 shadow-amber-900/30"
                          : "bg-[#16223E] text-white hover:bg-[#1f2f54] shadow-[0_12px_28px_-12px_rgba(28,42,71,0.7)]"}`}
                    >
                      <span className="relative z-10 flex items-center gap-2">Analiz Et {icons.send}</span>
                    </button>
                  </div>
                </div>
              </form>
            </PremiumCard>

            {/* Sonuç Alanı */}
            {active ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* SORGU */}
                {activeUserQuery && (
                  <div className={`flex items-start gap-4 p-5 rounded-2xl border ${c.line} ${isDarkMode ? "bg-white/[0.02]" : "bg-[#F6EFE2]"}`}>
                    <div className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-mono tracking-[0.18em] border ${c.goldBg} ${c.goldBorder} ${c.gold}`}>SORGU</div>
                    <div className={`text-sm leading-relaxed ${c.ink}`}>{activeUserQuery}</div>
                  </div>
                )}

                {/* SONUÇ */}
                <PremiumCard
                  className="min-h-[400px]"
                  noPadding
                  isDarkMode={isDarkMode}
                  eyebrow="Hukuki Görüş"
                  title={!active.title ? "Analiz Sonucu" : active.title}
                  icon={icons.scale}
                  action={
                    !isLoading && activeMarkdown && (
                      <button
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        className={`flex items-center gap-2 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider border rounded-lg transition-all disabled:opacity-50
                          ${isDarkMode
                            ? "text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border-amber-400/30"
                            : "text-white bg-[#16223E] border-[#16223E] hover:bg-[#1f2f54]"}`}
                      >
                        {isDownloading ? "İndiriliyor…" : "PDF İndir"} {icons.download}
                      </button>
                    )
                  }
                >
                  <div className="p-5 md:p-8">
                    {/* başlangıç süslü ilk harf hissi için ince üst çizgi */}
                    <div className={`hidden md:block w-12 h-0.5 mb-6 ${isDarkMode ? "bg-amber-400/50" : "bg-[#A77B2E]"}`}></div>
                    <div className={`prose max-w-none
                      ${isDarkMode ? "prose-invert" : "prose-slate"}
                      prose-headings:font-serif prose-headings:tracking-tight
                      prose-p:leading-7 prose-p:text-[15px] md:prose-p:text-base
                      prose-a:no-underline hover:prose-a:underline
                      prose-blockquote:border-l-4 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:font-serif
                      ${isDarkMode
                        ? "prose-p:text-slate-200 prose-headings:text-white prose-strong:text-amber-300 prose-li:text-slate-200 prose-a:text-amber-400 hover:prose-a:text-amber-300 prose-blockquote:bg-amber-400/[0.06] prose-blockquote:text-amber-100 prose-blockquote:border-amber-400"
                        : "prose-p:text-[#33405A] prose-headings:text-[#16223E] prose-strong:text-[#1C2A47] prose-li:text-[#33405A] prose-a:text-[#A77B2E] hover:prose-a:text-[#7d5a1f] prose-a:underline-offset-4 prose-blockquote:bg-[#F6EFE2] prose-blockquote:text-[#1C2A47] prose-blockquote:border-[#A77B2E]"}
                    `}>
                      {activeMarkdown ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            a: ({ node, ...props }) => {
                              const isCitation = props.href && props.href.startsWith("/kararlar/");
                              const isFootnote = typeof props.children?.[0] === "string" && !isNaN(props.children[0]);

                              if (isCitation) {
                                if (isFootnote) {
                                  return (
                                    <a {...props} target="_blank" className={`inline-flex items-center justify-center min-w-[20px] px-1.5 h-5 mx-0.5 rounded text-[10px] font-bold border transition-all no-underline align-middle ${isDarkMode ? "bg-amber-400/10 border-amber-400/30 text-amber-300 hover:bg-amber-400 hover:text-[#0A0F1C]" : "bg-[#F2E7CC] border-[#DCC68C] text-[#A77B2E] hover:bg-[#16223E] hover:text-white hover:border-[#16223E]"}`}>
                                      {props.children}
                                    </a>
                                  );
                                }
                                return (
                                  <a {...props} target="_blank" className={`font-medium underline-offset-4 transition-colors ${isDarkMode ? "text-amber-400 hover:text-amber-300" : "text-[#A77B2E] hover:text-[#7d5a1f]"}`}>
                                    {props.children}
                                  </a>
                                );
                              }
                              return <a {...props} className={isDarkMode ? "text-amber-400 hover:underline" : "text-[#A77B2E] hover:underline"} />;
                            },
                          }}
                        >
                          {activeMarkdown}
                        </ReactMarkdown>
                      ) : (
                        !isLoading && (
                          <div className={`flex flex-col items-center justify-center py-20 ${c.inkMute}`}>
                            <span className="text-4xl mb-4 opacity-60">⚖️</span>
                            <p className="font-serif italic">Analiz sonucu bekleniyor…</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </PremiumCard>
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center h-[52vh] rounded-3xl border border-dashed ${c.line} ${isDarkMode ? "bg-white/[0.015]" : "bg-[#F6EFE2]/60"}`}>
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border ${c.line} ${c.surfaceAlt}`}>
                  <span className={c.gold}>{icons.scale}</span>
                </div>
                <h3 className={`text-xl font-serif font-semibold mb-2 ${c.ink}`}>Sistem Hazır</h3>
                <p className={`text-sm max-w-xs text-center px-4 ${c.inkSoft}`}>Hukuki analiz motorunu başlatmak için yukarıdan meseleyi yazın ya da soldan yeni bir analiz oluşturun.</p>
              </div>
            )}
          </div>
        </main>

        {/* SAĞ: Kaynaklar */}
        <aside
          className={`lg:col-span-3 flex flex-col min-h-0
            fixed top-0 bottom-0 right-0 z-[80] w-[310px] shadow-2xl lg:shadow-none
            transform transition-transform duration-300 ease-in-out lg:static lg:transform-none lg:w-auto
            ${mobileResourcesOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
            ${isDarkMode ? "bg-[#0A0F1C] lg:bg-transparent" : "bg-[#F3EDE1] lg:bg-transparent"}
            lg:h-fit lg:sticky lg:top-0 lg:max-h-[calc(100vh-2rem)] pt-4 lg:pt-0`}
        >
          <div className={`lg:hidden flex items-center justify-between px-4 py-3 border-b ${c.lineSoft}`}>
            <div className="flex items-center gap-2">
              <span className={c.gold}>{icons.book}</span>
              <h2 className={`text-sm font-serif font-semibold ${c.ink}`}>Yararlanılan Kaynaklar</h2>
            </div>
            <button onClick={() => setMobileResourcesOpen(false)} className={c.inkSoft}>{icons.close}</button>
          </div>

          <PremiumCard className="h-fit" noPadding isDarkMode={isDarkMode} eyebrow="Atıflar" title="İncelenen Kaynaklar" icon={icons.book}>
            <div className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar pb-4 max-h-[70vh]">

                {/* Mevzuat */}
                <div className={`flex flex-col border-b ${c.lineSoft}`}>
                  <div
                    onClick={() => toggleSection("mevzuat")}
                    className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors ${isDarkMode ? "hover:bg-white/[0.03]" : "hover:bg-[#F6EFE2]"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1 h-4 rounded-full ${isDarkMode ? "bg-amber-400/70" : "bg-[#A77B2E]"}`}></span>
                      <h3 className={`text-xs font-serif font-semibold tracking-wide ${c.ink}`}>Mevzuat</h3>
                    </div>
                    <span className={c.inkMute}>{openSections.mevzuat ? icons.chevronUp : icons.chevronDown}</span>
                  </div>

                  {openSections.mevzuat && (
                    <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
                      <div className={`divide-y ${c.lineSoft}`}>
                        {active?.sources?.mevzuat?.length ? active.sources.mevzuat.map((m, i) => {
                          const slug = utils.slugifyMevzuatAdi(m.mevzuat_adi || "");
                          const popKey = `${slug}::${m.madde}`;
                          const preview = getMevzuatPreview(m);
                          return (
                            <div
                              key={i}
                              data-mevzuat-popover="1"
                              onClick={(e) => {
                                e.stopPropagation();
                                const el = e.currentTarget;
                                const pos = calcMevzuatPopover(el);
                                setOpenMevzuat((prev) => (prev?.key === popKey ? null : { key: popKey, preview, mevzuat_adi: m.mevzuat_adi, madde: m.madde, el, ...pos }));
                              }}
                              className={`group/item relative transition-colors cursor-pointer ${isDarkMode ? "hover:bg-white/[0.03]" : "hover:bg-[#F6EFE2]"}`}
                            >
                              <div className="px-4 py-3.5 flex gap-3 items-start">
                                {m.madde && (
                                  <button type="button" className={`shrink-0 flex items-center justify-center min-w-[42px] h-8 px-2 rounded-md text-[10px] font-mono font-bold border transition-all
                                    ${openMevzuat?.key === popKey
                                      ? (isDarkMode ? "bg-amber-400 text-[#0A0F1C] border-amber-400" : "bg-[#16223E] text-white border-[#16223E]")
                                      : (isDarkMode ? "bg-[#0D1322] text-slate-400 border-white/10 group-hover/item:border-amber-400/40 group-hover/item:text-amber-300" : "bg-white text-[#5B6478] border-[#E4DAC6] group-hover/item:border-[#DCC68C] group-hover/item:text-[#A77B2E]")}`}>
                                    m.{m.madde}
                                  </button>
                                )}
                                <div className="min-w-0 flex-1 pt-1">
                                  <div className={`text-xs font-medium leading-snug ${c.inkSoft} group-hover/item:${isDarkMode ? "text-white" : "text-[#1C2A47]"}`}>{m.mevzuat_adi}</div>
                                </div>
                              </div>
                              <span className={`absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover/item:opacity-100 transition-opacity ${isDarkMode ? "bg-amber-400" : "bg-[#A77B2E]"}`}></span>
                            </div>
                          );
                        }) : <div className={`px-4 py-6 text-center text-xs ${c.inkMute}`}>Kayıt bulunamadı.</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Yargıtay Kararları */}
                <div className="flex flex-col">
                  <div
                    onClick={() => toggleSection("kararlar")}
                    className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors ${isDarkMode ? "hover:bg-white/[0.03]" : "hover:bg-[#F6EFE2]"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1 h-4 rounded-full ${isDarkMode ? "bg-amber-400/70" : "bg-[#A77B2E]"}`}></span>
                      <h3 className={`text-xs font-serif font-semibold tracking-wide ${c.ink}`}>Yargıtay Kararları</h3>
                    </div>
                    <span className={c.inkMute}>{openSections.kararlar ? icons.chevronUp : icons.chevronDown}</span>
                  </div>

                  {openSections.kararlar && (
                    <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
                      <div className={`divide-y ${c.lineSoft}`}>
                        {(() => {
                          const renderList = (items) => items.map((r, i) => (
                            <div key={i} className={`px-4 py-3.5 transition-colors group/karar ${isDarkMode ? "hover:bg-white/[0.03]" : "hover:bg-[#F6EFE2]"}`}>
                              <div className="flex flex-col gap-1">
                                {r.court && <span className={`text-[10px] font-mono tracking-wider uppercase ${c.inkMute}`}>{r.court}</span>}
                                {r.slug && utils.looksLikeSlug(r.slug) ? (
                                  <a href={`/kararlar/${encodeURIComponent(r.slug)}`} target="_blank" className={`text-xs font-medium transition-all underline-offset-4 ${isDarkMode ? "text-amber-400 hover:text-amber-300 hover:underline" : "text-[#A77B2E] hover:text-[#7d5a1f] hover:underline"}`}>
                                    {r.code || r.slug}
                                  </a>
                                ) : (
                                  <span className={`text-xs ${c.inkSoft}`}>{r.code || r.slug}</span>
                                )}
                              </div>
                            </div>
                          ));

                          if (active?.sources?.karar_kartlari?.length) {
                            return renderList(active.sources.karar_kartlari.map((r) => ({ slug: utils.slugFromTypeAndCode(r.type || "", r.code || "") || r.slug, code: r.code || r.slug, court: r.type })));
                          }
                          if (active?.sources?.kararlar?.length) {
                            const allProps = active.sources.kararlar.map((k) => ({ code: k?.code || "", type: k?.type || "", orijinal_karar_id: k?.id || "", dosya_adi: k?.dosya || "", kaynak_turu: k?.tip || "" }));
                            const dict = new Map();
                            allProps.forEach((p) => {
                              const slug = utils.bestSlugFromProps(p, allProps);
                              const key = slug || String(p.orijinal_karar_id || p.dosya_adi || "").replace(/\.txt$/i, "");
                              if (!key) return;
                              const rec = dict.get(key) || { slug, code: "", court: "" };
                              if (slug && !rec.slug) rec.slug = slug;
                              if (!rec.code) rec.code = utils.deduceEsasKararFromProps(p);
                              if (!rec.court) rec.court = utils.deduceCourtLabelFromProps(p);
                              const auto = utils.slugFromTypeAndCode(rec.court, rec.code);
                              if (auto && !rec.slug) rec.slug = auto;
                              dict.set(key, rec);
                            });
                            const list = Array.from(dict.values()).filter((r) => r.code || r.court || r.slug).sort((a, b) => (a.court || "").localeCompare(b.court || ""));
                            if (list.length) return renderList(list);
                          }
                          return <div className={`px-4 py-6 text-center text-xs ${c.inkMute}`}>Kayıt bulunamadı.</div>;
                        })()}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </PremiumCard>
        </aside>

      </div>

      {/* ====================== Popovers & Modals ====================== */}
      {openMevzuat && (
        <MevzuatPopover
          data={openMevzuat}
          position={{ top: openMevzuat.top, left: openMevzuat.left }}
          onClose={() => setOpenMevzuat(null)}
          isDarkMode={isDarkMode}
        />
      )}

      {confirmDel.open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDel({ open: false, id: null })} />
          <div className={`relative w-full max-w-sm rounded-2xl border ${c.line} ${c.surfaceAlt} shadow-2xl p-6 overflow-hidden animate-in zoom-in-95`}>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 text-red-500 mb-4 border border-red-500/30">
                {icons.trash}
              </div>
              <h3 className={`text-lg font-serif font-semibold ${c.ink}`}>Analizi Sil</h3>
              <p className={`mt-2 text-sm ${c.inkSoft}`}>
                {(() => {
                  const doomed = chats.find((cc) => cc.id === confirmDel.id);
                  const t = (doomed?.title || doomed?.messages?.find((m) => m.sender === "user")?.text || "").trim();
                  return t ? `"${t.slice(0, 30)}${t.length > 30 ? "..." : ""}"` : "Seçili analiz";
                })()} kalıcı olarak silinecek.
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setConfirmDel({ open: false, id: null })} className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${isDarkMode ? "text-slate-300 bg-white/[0.03] hover:bg-white/[0.06] border-white/10" : "text-[#5B6478] bg-[#F6EFE2] hover:bg-[#EFE6D4] border-[#E4DAC6]"}`}>İptal</button>
              <button onClick={() => { const id = confirmDel.id; setConfirmDel({ open: false, id: null }); deleteChatById(id); }} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-900/20 transition-colors">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}