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

// --- UI Bileşenleri ---

// 1. Cyber Loader (Renkler Güçlendirildi)
const CyberLoader = ({ isDarkMode }) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const messages = [
    "SİSTEM BAŞLATILIYOR...",
    "MEVZUAT VERİ TABANI TARANIYOR...",
    "YARGITAY İÇTİHATLARI EŞLEŞTİRİLİYOR...",
    "SEMANTİK ANALİZ YAPILIYOR...",
    "HUKUKİ GÖRÜŞ OLUŞTURULUYOR..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full backdrop-blur-sm rounded-xl border shadow-lg transition-colors duration-300 ${isDarkMode ? "bg-slate-900/80 border-cyan-500/20 shadow-cyan-500/10" : "bg-white border-slate-300 shadow-xl shadow-slate-200"}`}>
      <div className="relative">
        <div className={`w-16 h-16 border-4 rounded-full animate-spin-slow ${isDarkMode ? "border-cyan-900/30" : "border-slate-200"}`}></div>
        <div className={`absolute top-0 left-0 w-16 h-16 border-t-4 rounded-full animate-spin ${isDarkMode ? "border-cyan-500" : "border-blue-900"}`}></div>
        <div className="absolute top-2 left-2 w-12 h-12 border-b-4 rounded-full animate-pulse border-blue-700"></div>
      </div>
      <div className="mt-6 flex flex-col items-center gap-2">
        <span className={`text-xs font-mono tracking-[0.2em] animate-pulse font-bold ${isDarkMode ? "text-cyan-600" : "text-blue-900"}`}>AI PROCESSING</span>
        <span className={`text-[10px] font-mono font-bold transition-colors duration-300 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{messages[msgIndex]}</span>
      </div>
      <div className={`w-48 h-1 rounded-full mt-4 overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}>
        <div className={`h-full bg-gradient-to-r w-full animate-shimmer ${isDarkMode ? "from-cyan-500 via-blue-500 to-cyan-500" : "from-blue-900 via-indigo-800 to-blue-900"}`}></div>
      </div>
    </div>
  );
};

// 2. Premium Kart (Net Çerçeveli ve Kontrastlı)
const PremiumCard = ({ title, icon, children, className = "", noPadding = false, action, isDarkMode }) => (
  <div className={`relative flex flex-col backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-300 h-full
    ${isDarkMode 
      ? "bg-[#0f172a]/90 border-slate-700/50 shadow-xl hover:border-cyan-500/30" 
: "bg-slate-50 border-slate-200 shadow-sm hover:shadow-md hover:border-blue-900"    } ${className}`}>
    
    {(title || icon || action) && (
      <div className={`flex-none flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? "border-white/5 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
        <div className="flex items-center gap-3">
          {icon && <div className={isDarkMode ? "text-cyan-400" : "text-blue-900 drop-shadow-sm"}>{icon}</div>}
          {title && <h3 className={`text-xs font-extrabold tracking-widest uppercase font-mono ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>{title}</h3>}
        </div>
        {action}
      </div>
    )}
    <div className={`flex-1 min-h-0 relative flex flex-col ${noPadding ? "" : "p-5"}`}>{children}</div>
  </div>
);

// 3. Mevzuat Popover
const MevzuatPopover = ({ data, position, onClose, isDarkMode }) => {
  if (!data || !position) return null;
  return (
    <div 
      data-mevzuat-popover="1" 
      className={`fixed z-[9999] w-[450px] max-w-[90vw] flex flex-col border rounded-xl animate-in fade-in zoom-in-95 duration-200 shadow-2xl ${isDarkMode ? "bg-[#0B1120] border-cyan-500/30 text-slate-300 shadow-black/50" : "bg-white border-slate-300 text-slate-800 shadow-2xl shadow-slate-900/20"}`}
      style={{ top: position.top, left: position.left, transform: "translate(-50%, 0)" }}
      onClick={(e) => e.stopPropagation()} 
    >
      <div className={`flex items-center justify-between px-4 py-3 border-b rounded-t-xl ${isDarkMode ? "bg-gradient-to-r from-cyan-950 to-transparent border-cyan-900/50" : "bg-gradient-to-r from-slate-100 to-white border-slate-200"}`}>
        <div className="flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDarkMode ? "bg-cyan-500" : "bg-blue-900"}`}></div>
           <span className={`text-xs font-bold uppercase tracking-wider font-mono ${isDarkMode ? "text-cyan-100" : "text-blue-950"}`}>
             {data.mevzuat_adi} {data.madde ? `m.${data.madde}` : ''}
           </span>
        </div>
        <button onClick={onClose} className={`p-1 rounded transition-colors ${isDarkMode ? "hover:bg-white/10 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-600 hover:text-black"}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar">
        <div className={`text-xs leading-relaxed font-sans whitespace-pre-wrap ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>{data.preview}</div>
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
    utils
  } = useAnalysisBot();

  const { isDarkMode, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [openSections, setOpenSections] = useState({ mevzuat: true, kararlar: true });
  const [isDownloading, setIsDownloading] = useState(false);

  const toggleSection = (section) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
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
      
      const safeName = (active.title || "analiz").replace(/[^a-z0-9]/gi, '_').toLowerCase();
      saveAs(blob, `consulto_${safeName}.pdf`);
    } catch (err) {
      console.error("PDF Hatası:", err);
      alert("Hata oluştu.");
    } finally {
      setIsDownloading(false);
    }
  };

  const icons = {
    bot: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
    send: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>,
    plus: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>,
    trash: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    book: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    scale: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
    menu: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
    close: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    chevronDown: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    chevronUp: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
    download: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
    sun: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    moon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
  };

  return (
    // BG RENGİ DÜZELTİLDİ: #F1F5F9 (Slate-100) - Kırık Beyaz / Gri
    <div className={`flex flex-col h-screen font-sans overflow-hidden selection:bg-blue-300/40 selection:text-blue-950 transition-colors duration-500 ${isDarkMode ? "bg-[#020617] text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      
      <style jsx global>{`
        footer, .footer { display: none !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? "#334155" : "#cbd5e1"}; border-radius: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? "#475569" : "#94a3b8"}; }
        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2s infinite linear; }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.1; transform: scale(1); } 50% { opacity: 0.2; transform: scale(1.1); } }
        .animate-pulse-slow { animation: pulse-slow 8s infinite ease-in-out; }
      `}</style>

      {/* Arkaplan Efektleri */}
      <div className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-500 ${isDarkMode ? "opacity-100" : "opacity-0"}`}>
        {isDarkMode && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse-slow" style={{animationDelay: '2s'}}></div>
          </>
        )}
        {!isDarkMode && (
          <>
            <div className="absolute top-[20%] left-[-10%] w-[35%] h-[35%] bg-blue-200/40 rounded-full blur-[160px]"></div>
            <div className="absolute bottom-[15%] right-[-10%] w-[35%] h-[35%] bg-indigo-200/40 rounded-full blur-[160px]"></div>
          </>
        )}
      </div>

      {/* --- HEADER --- */}
      <header
        className={`
          flex-none z-[70] h-16 border-b backdrop-blur-xl
          items-center justify-between px-4 md:px-6 shadow-sm 
          ${isDarkMode ? "bg-[#020617]/70 border-white/5 shadow-black/20" : "bg-slate-100/80 border-slate-200 shadow-sm"}
          ${mobileMenuOpen || mobileResourcesOpen ? "hidden md:flex" : "flex"}
          ${mobileMenuOpen || mobileResourcesOpen ? "pointer-events-none" : "pointer-events-auto"}
        `}
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className={`md:hidden p-1.5 rounded-lg ${isDarkMode ? "text-slate-300 hover:text-white bg-slate-800/50" : "text-slate-600 hover:text-slate-900 bg-slate-100"}`}
          >
            {icons.menu}
          </button>

          <div className="relative group cursor-pointer hidden sm:block">
             <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-200"></div>
             {/* LOGO: Açık modda KOYU LACİVERT (#1e3a8a - Blue-900) */}
             <div className={`relative w-10 h-10 rounded-lg border flex items-center justify-center shadow-lg ${isDarkMode ? "bg-[#0f172a] border-slate-700 text-cyan-400" : "bg-blue-900 border-blue-950 text-white"}`}>
               {icons.scale}
             </div>
          </div>
          <div className="flex flex-col">
             <h1 className={`text-lg font-bold tracking-tight leading-none ${isDarkMode ? "text-white" : "text-slate-900"}`}>
               Analiz <span className={`font-light ${isDarkMode ? "text-cyan-500" : "text-blue-700"}`}>AI</span>
             </h1>
             <span className={`text-[10px] font-mono tracking-[0.2em] uppercase mt-1 ${isDarkMode ? "text-cyan-600/80" : "text-slate-600"}`}>Legal Intellıgence</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={toggleTheme}
             className={`p-2 rounded-full border transition-all ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-yellow-400 hover:bg-slate-700" : "bg-slate-50 border-slate-300 text-slate-600 hover:text-orange-600 hover:bg-slate-100"}`}
             title={isDarkMode ? "Açık Mod" : "Koyu Mod"}
           >
             {isDarkMode ? icons.sun : icons.moon}
           </button>

           <button 
             onClick={() => setMobileResourcesOpen(prev => !prev)}
             className={`lg:hidden p-2 rounded-full border ${isDarkMode ? "text-cyan-400 hover:text-cyan-300 bg-cyan-900/20 border-cyan-800/50" : "text-blue-900 hover:text-blue-950 bg-blue-100 border-blue-300"}`}
             aria-label="Kaynaklar"
           >
             {icons.book}
           </button>

          <div className={`hidden md:flex items-center px-4 py-1.5 rounded-full border text-[10px] gap-3 ${isDarkMode ? "bg-slate-900/80 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600 shadow-sm"}`}>
             <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span>ONLINE</span>
             <span className={`w-px h-3 ${isDarkMode ? "bg-slate-700" : "bg-slate-300"}`}></span>
             <span>VERİ TABANI: GÜNCEL</span>
          </div>
        </div>
      </header>

      {/* --- Main Layout --- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full h-[calc(100vh-4rem)] overflow-hidden relative z-10 px-4 md:px-6 pt-0 pb-6">
        
        {(mobileMenuOpen || mobileResourcesOpen) && (
          <div
            className="fixed inset-x-0 bottom-0 top-16 z-[55] bg-black/80 backdrop-blur-md md:hidden"
            onClick={() => {
              setMobileMenuOpen(false);
              setMobileResourcesOpen(false);
            }}
          />
        )}
        
        {/* SOL: Geçmiş Analizler Sidebar */}
        <aside 
          className={`
            md:col-span-3 lg:col-span-3 flex flex-col h-full min-h-0 pt-4
            fixed top-16 bottom-0 left-0 z-[80] w-[85vw] max-w-[320px] shadow-2xl md:shadow-none
            transform transition-transform duration-300 ease-in-out border-r md:border-none md:static md:transform-none md:w-auto
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isDarkMode ? "bg-[#020617] md:bg-transparent border-slate-800" : "bg-slate-100 md:bg-transparent border-slate-200"}
          `}
        >
          <div className={`md:hidden px-4 py-3 border-b ${isDarkMode ? "border-white/5 bg-[#020617]/80" : "border-slate-200 bg-white/80"}`}>
            <h2 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Analiz <span className="text-cyan-500 font-light">AI</span>
            </h2>
          </div>
          <div className="flex justify-end p-2 md:hidden">
             <button onClick={() => setMobileMenuOpen(false)} className={`p-2 ${isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}>{icons.close}</button>
          </div>

          <PremiumCard className="h-full" noPadding isDarkMode={isDarkMode}>
            <div className="flex flex-col h-full overscroll-contain">
              
              <div className="pt-4">
                 <TokenBalance />
              </div>

              <div className="p-5 space-y-4 flex-none">
                {/* YENİ ANALİZ BUTONU: CANLI BEYAZ + MAVİ YAZI + HOVER DOLGU */}
                <button 
                  onClick={() => { const c = createEmptyAnalysis(""); setActiveId(c.id); setMobileMenuOpen(false); }}
                  className={`group relative w-full flex items-center justify-center gap-2 overflow-hidden text-sm font-bold py-3 rounded-xl transition-all duration-300 border shadow-md ${isDarkMode ? "bg-cyan-950/30 hover:bg-cyan-900/50 border-cyan-800/50 hover:border-cyan-500 text-cyan-100" : "bg-slate-50 hover:bg-blue-100 border-blue-300 hover:border-blue-900 text-blue-900"}`}
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
                  {icons.plus} <span>YENİ ANALİZ BAŞLAT</span>
                </button>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Analizlerde ara..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={`w-full border rounded-lg py-2.5 px-4 text-xs transition-all focus:outline-none focus:ring-1 ${isDarkMode ? "bg-[#0f172a] border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20" : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-200/70 shadow-sm"}`}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-20 custom-scrollbar">
                <div className="space-y-1">
                  {filteredChats.map(item => {
                    const isActive = item.id === activeId;
                    const title = utils.cleanTitle(item.title) || (item.messages?.find(m => m.sender === "user")?.text || "Başlıksız");
                    return (
                      <div 
                        key={item.id}
                        onClick={() => handleSelectChat(item.id)}
                        className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                            isActive 
                            ? (isDarkMode ? "bg-slate-800/80 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "bg-white border-blue-400 shadow-sm ring-0 z-10") 
                            : "border-transparent " + (isDarkMode ? "hover:bg-slate-800/40 hover:border-slate-800" : "hover:bg-white hover:border-slate-300 hover:shadow-sm")
                        }`}
                      >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className={`text-xs font-bold truncate mb-1 ${
                                  isActive 
                                  ? (isDarkMode ? "text-cyan-100" : "text-blue-900") 
                                  : (isDarkMode ? "text-slate-400 group-hover:text-slate-200" : "text-slate-600 group-hover:text-slate-900")
                              }`}>{title}</h4>
                              <span className={`text-[10px] font-mono ${isDarkMode ? "text-slate-600" : "text-slate-400"}`}>{new Date(item.createdAt || Date.now()).toLocaleDateString('tr-TR')}</span>
                            </div>
                            {isActive && <div className={`w-1.5 h-1.5 rounded-full shadow-lg ${isDarkMode ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : "bg-blue-600"}`}></div>}
                          </div>
                          <button 
                            onClick={(e) => onDeleteClick(e, item.id)}
                            className={`absolute right-2 bottom-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all z-10 ${isDarkMode ? "bg-slate-900/80 text-slate-500 hover:text-red-400 hover:bg-red-900/20" : "bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-200"}`}
                          >
                            {icons.trash}
                          </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </PremiumCard>
        </aside>

        {/* ORTA: Chat & Analiz Alanı */}
        <main
          className={`
            md:col-span-9 lg:col-span-6 flex flex-col h-full min-h-0 overflow-y-auto custom-scrollbar bg-transparent z-10 pt-4
            ${(mobileMenuOpen || mobileResourcesOpen) ? "hidden md:flex" : "flex"}
          `}
        >
          <div className="flex flex-col gap-6 pb-20">
              
              {/* Soru Alanı */}
              <PremiumCard className={`z-10 ${isDarkMode ? "bg-[#0f172a]" : "bg-slate-50/90 backdrop-blur-sm"}`} isDarkMode={isDarkMode}>
                  <form onSubmit={handleAnalyze} className="relative">
                      <textarea 
                          disabled={isLoading}
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          placeholder="Hukuki meseleyi, dava türünü ve delil durumunu buraya detaylıca yazın..." 
                          className={`w-full border rounded-xl p-4 min-h-[120px] text-sm focus:outline-none focus:ring-1 transition-all resize-y 
                            ${isDarkMode 
                                ? "bg-[#020617] border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20 focus:shadow-[0_0_20px_rgba(6,182,212,0.05)]" 
                                : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-100 focus:bg-white"
                            } 
                            ${isLoading ? "opacity-30 pointer-events-none" : ""} max-h-[40vh] md:max-h-none`}
                      />
                      
                      {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center z-20">
                            <CyberLoader isDarkMode={isDarkMode} />
                          </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4 sm:gap-0">
                          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                              {/* TAG BUTONLARI: Beyaz zemin, Mavi Yazı, Mavi Çerçeve */}
                              {["YARGITAY", "MEVZUAT"].map(tag => (
                                  <span key={tag} className={`text-[9px] font-mono border px-2 py-1 rounded select-none whitespace-nowrap ${isDarkMode ? "text-cyan-900 bg-cyan-900/10 border-cyan-900/20" : "text-blue-900 bg-blue-100 border-blue-300"}`}>
                                    {tag}
                                  </span>
                              ))}
                          </div>
                          <div className="flex gap-3 w-full sm:w-auto justify-end">
                              {input && !isLoading && (
                                  <button type="button" onClick={() => setInput("")} className={`px-4 py-2 text-xs font-medium transition-colors ${isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-800"}`}>Vazgeç</button>
                              )}
                              {/* ANALİZ ET BUTONU: GÜÇLÜ LACİVERT/MAVİ GRADYAN */}
                              <button 
                                  type="submit" 
                                  disabled={isLoading || !input.trim()}
                                  className={`group relative inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold tracking-wide rounded-lg shadow-lg disabled:opacity-50 disabled:shadow-none transition-all duration-300 overflow-hidden ${isDarkMode ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-900/30 hover:shadow-cyan-500/40" : "bg-gradient-to-r from-blue-700 to-indigo-900 text-white shadow-indigo-300 hover:shadow-indigo-500"}`}
                              >
                                  <span className="relative z-10 flex items-center gap-2">ANALİZ ET {icons.send}</span>
                                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                              </button>
                          </div>
                      </div>
                  </form>
              </PremiumCard>

              {/* Sonuç Alanı */}
              {active ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        
                        {/* SORGU KUTUSU */}
                        {activeUserQuery && (
                            <div className={`flex flex-col gap-4 p-5 rounded-2xl border border-dashed ${isDarkMode ? "bg-[#0f172a]/40 border-slate-700/50" : "bg-slate-50 border-slate-300 shadow-sm"}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold border tracking-wider ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-300 text-slate-700"}`}>SORGU</div>
                                    <div className={`text-sm leading-relaxed font-light ${isDarkMode ? "text-slate-300" : "text-slate-900"}`}>{activeUserQuery}</div>
                                </div>
                            </div>
                        )}

                        {/* Sonuç Kartı */}
                        <PremiumCard 
                          className={`min-h-[400px] ${isDarkMode ? "" : "bg-slate-50/90 backdrop-blur-sm"}`} 
                          noPadding 
                          isDarkMode={isDarkMode}
                          title={!active.title ? "ANALİZ SONUCU" : active.title}
                          icon={icons.scale}
                          // PDF İNDİRME: Sağ Üst Köşede
                          action={
                            !isLoading && activeMarkdown && (
                              <button 
                                onClick={handleDownloadPDF}
                                disabled={isDownloading}
                                className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border rounded-lg transition-all disabled:opacity-50 ${isDarkMode ? "text-cyan-400 bg-cyan-900/20 hover:bg-cyan-900/40 border-cyan-800/50" : "text-blue-900 bg-slate-100 border-blue-800 hover:bg-blue-200 shadow-sm"}`}
                              >
                                {isDownloading ? "İndiriliyor..." : "PDF İNDİR"} {icons.download}
                              </button>
                            )
                          }
                        >
                          <div className="p-4 md:p-8">
                            <div className={`prose max-w-none 
                                ${isDarkMode ? "prose-invert" : "prose-slate"}
                                prose-p:leading-7 prose-p:font-light prose-p:text-sm md:prose-p:text-base
                                prose-headings:font-semibold prose-headings:tracking-tight
                                prose-a:no-underline hover:prose-a:underline
                                prose-blockquote:border-l-4 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                                ${isDarkMode 
                                    ? "prose-p:text-slate-200 prose-headings:text-white prose-strong:text-cyan-300 prose-li:text-slate-200 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-blockquote:bg-cyan-950/10 prose-blockquote:text-cyan-100 prose-blockquote:border-cyan-500" 
: "prose-p:text-slate-800 prose-headings:text-blue-950 prose-strong:text-blue-900 prose-li:text-slate-700 prose-a:text-blue-800 hover:prose-a:text-blue-950 prose-a:underline-offset-4 prose-a:decoration-blue-300 prose-blockquote:bg-blue-50 prose-blockquote:text-slate-900 prose-blockquote:border-blue-800"                                }
                            `}>
                                {activeMarkdown ? (
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]} 
                                        rehypePlugins={[rehypeRaw]} 
                                        components={{
                                            a: ({node, ...props}) => {
                                                const isCitation = props.href && props.href.startsWith("/kararlar/");
                                                const isFootnote = typeof props.children?.[0] === 'string' && !isNaN(props.children[0]);

                                                if(isCitation) {
                                                    if (isFootnote) {
                                                        return (
                                                            <a {...props} target="_blank" className={`inline-flex items-center justify-center min-w-[20px] px-1.5 h-5 mx-0.5 rounded text-[10px] font-bold border transition-all no-underline align-middle ${isDarkMode ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-white" : "bg-blue-100 border-blue-300 text-blue-900 hover:bg-blue-900 hover:text-white"}`}>
                                                                {props.children}
                                                            </a>
                                                        );
                                                    } else {
                                                        return (
                                                            <a {...props} target="_blank" className={`font-medium underline-offset-4 transition-colors ${isDarkMode ? "text-cyan-400 hover:text-cyan-300 decoration-cyan-500/30" : "text-blue-800 hover:text-blue-950 decoration-blue-200"}`}>
                                                                {props.children}
                                                            </a>
                                                        );
                                                    }
                                                }
                                                return <a {...props} className="text-blue-600 hover:underline" />;
                                            }
                                        }}
                                    >
                                        {activeMarkdown}
                                    </ReactMarkdown>
                                ) : (
                                    !isLoading && <div className={`flex flex-col items-center justify-center py-20 opacity-50 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}><span className="text-4xl mb-4">⚖️</span><p>Analiz sonucu bekleniyor...</p></div>
                                )}
                            </div>
                          </div>
                        </PremiumCard>
                  </div>
              ) : (
                  <div className={`flex flex-col items-center justify-center h-[50vh] rounded-3xl border border-dashed ${isDarkMode ? "text-slate-600 bg-[#0f172a]/30 border-slate-800" : "text-slate-500 bg-slate-50 border-slate-200"}`}>
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"}`}><span className={`text-4xl ${isDarkMode ? "text-cyan-900/40" : "text-slate-300"}`}>{icons.scale}</span></div>
                      <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Sistem Hazır</h3>
                      <p className={`text-sm max-w-xs text-center px-4 ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>Hukuki analiz motorunu başlatmak için sol menüden yeni bir analiz oluşturun.</p>
                  </div>
              )}
          </div>
        </main>

        {/* SAĞ: Kaynaklar Sidebar */}
        <aside 
          className={`
            lg:col-span-3 flex flex-col min-h-0 pt-4
            fixed top-16 bottom-0 right-0 z-[80] w-[300px] shadow-2xl lg:shadow-none
            transform transition-transform duration-300 ease-in-out border-l lg:border-none lg:static lg:transform-none lg:w-auto
            ${mobileResourcesOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            ${isDarkMode ? "bg-[#020617] lg:bg-transparent border-slate-800" : "bg-slate-100 lg:bg-transparent border-slate-200"}
            lg:h-fit lg:sticky lg:top-0 lg:max-h-[calc(100vh-2rem)]
          `}
        >
            <div className={`lg:hidden px-4 py-3 border-b flex items-center justify-between ${isDarkMode ? "border-white/5 bg-[#020617]/80" : "border-slate-200 bg-white/80"}`}>
              <div className="flex items-center gap-2">
                <div className={isDarkMode ? "text-cyan-400" : "text-slate-700"}>{icons.book}</div>
                <div>
                  <h2 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Yararlanılan Kaynaklar</h2>
                </div>
              </div>
              <button
                onClick={() => setMobileResourcesOpen(false)}
                className={`p-2 ${isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
                aria-label="Kapat"
              >
                {icons.close}
              </button>
            </div>

            <PremiumCard 
              className="h-fit"
              noPadding 
              isDarkMode={isDarkMode}
              title=" İNCELENEN KAYNAKLAR"
              icon={icons.book}
            >
              <div className="flex flex-col overflow-hidden">
                
                {/* Scroll edilebilir alan */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-4 max-h-[70vh]">
                  
                  {/* Mevzuat Bölümü */}
                  <div className={`flex flex-col min-h-0 border-b transition-all duration-300 ${openSections.mevzuat ? "flex-none" : "flex-none"} ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
                      <div 
                        onClick={() => toggleSection('mevzuat')}
                        className={`p-4 border-b flex items-center justify-between flex-none cursor-pointer transition-colors ${isDarkMode ? "border-white/5 bg-white/5 hover:bg-white/10" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
                      >
                          <div className="flex items-center gap-2">
                            <h3 className={`text-xs font-bold tracking-widest uppercase ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>Mevzuat</h3>
                          </div>
                          <div className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
                            {openSections.mevzuat ? icons.chevronUp : icons.chevronDown}
                          </div>
                      </div>
                      
                      {openSections.mevzuat && (
                        // YÜKSEKLİK AYARI: max-h-[180px]
                        <div className="bg-opacity-50 max-h-[180px] overflow-y-auto custom-scrollbar">
                            <div className={`divide-y ${isDarkMode ? "divide-white/5" : "divide-slate-200"}`}>
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
                                                setOpenMevzuat(prev => (
                                                    prev?.key === popKey 
                                                      ? null 
                                                      : { 
                                                          key: popKey, 
                                                          preview, 
                                                          mevzuat_adi: m.mevzuat_adi, 
                                                          madde: m.madde, 
                                                          el, 
                                                          ...pos 
                                                        }
                                                )); 
                                            }}
                                            className={`group/item relative transition-colors cursor-pointer ${isDarkMode ? "hover:bg-white/5" : "hover:bg-blue-50"}`}
                                        >
                                            <div className="p-4 flex gap-3 items-start">
                                                {m.madde && (
                                                    <button type="button" className={`shrink-0 flex items-center justify-center w-10 h-8 rounded text-[10px] font-bold border transition-all ${
                                                        openMevzuat?.key === popKey 
                                                        ? (isDarkMode ? "bg-cyan-500 text-white border-cyan-400" : "bg-blue-800 text-white border-blue-900")
                                                        : (isDarkMode ? "bg-slate-900 text-slate-400 border-slate-700 group-hover/item:border-cyan-500/50 group-hover/item:text-cyan-400" : "bg-white text-slate-700 border-slate-200 group-hover/item:border-blue-400 group-hover/item:text-blue-800")
                                                    }`}>
                                                        m.{m.madde}
                                                    </button>
                                                )}
                                                <div className="min-w-0 flex-1 pt-1">
                                                    <div className={`text-xs font-medium transition-colors ${isDarkMode ? "text-slate-300 group-hover/item:text-white" : "text-slate-700 group-hover/item:text-black"}`}>{m.mevzuat_adi}</div>
                                                </div>
                                            </div>
                                            <div className={`absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover/item:opacity-100 transition-opacity ${isDarkMode ? "bg-cyan-500" : "bg-blue-900/80"}`}></div>
                                        </div>
                                    );
                                }) : <div className={`p-6 text-center text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Kayıt bulunamadı.</div>}
                            </div>
                        </div>
                      )}
                  </div>

                  {/* Kararlar Bölümü */}
                  <div className={`flex flex-col min-h-0 transition-all duration-300 ${openSections.kararlar ? "flex-none" : "flex-none"}`}>
                      <div 
                        onClick={() => toggleSection('kararlar')}
                        className={`p-4 border-b flex items-center justify-between flex-none cursor-pointer transition-colors ${isDarkMode ? "border-white/5 bg-white/5 hover:bg-white/10" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
                      >
                          <div className="flex items-center gap-2">
                            <h3 className={`text-xs font-bold tracking-widest uppercase ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>Yargıtay Kararları</h3>
                          </div>
                          <div className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
                            {openSections.kararlar ? icons.chevronUp : icons.chevronDown}
                          </div>
                      </div>
                      
                      {openSections.kararlar && (
                        // YÜKSEKLİK AYARI: max-h-[180px]
                        <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
                            <div className={`divide-y ${isDarkMode ? "divide-white/5" : "divide-slate-200"}`}>
                                {(() => {
                                    const renderList = (items) => items.map((r, i) => (
                                        <div key={i} className={`p-4 transition-colors group/karar ${isDarkMode ? "hover:bg-white/5" : "hover:bg-blue-50"}`}>
                                            <div className="flex flex-col gap-1">
                                                {r.court && <span className={`text-[10px] font-mono font-bold uppercase ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>{r.court}</span>}
                                                {r.slug && utils.looksLikeSlug(r.slug) ? (
                                                    <a href={`/kararlar/${encodeURIComponent(r.slug)}`} target="_blank" className={`text-xs transition-all underline-offset-4 ${isDarkMode ? "text-cyan-400 hover:text-cyan-300 hover:underline decoration-cyan-500/30" : "text-blue-800 hover:text-blue-950 hover:underline decoration-blue-200"}`}>
                                                        {r.code || r.slug}
                                                    </a>
                                                ) : (
                                                    <span className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{r.code || r.slug}</span>
                                                )}
                                            </div>
                                        </div>
                                    ));

                                    if (active?.sources?.karar_kartlari?.length) {
                                        return renderList(active.sources.karar_kartlari.map(r => ({ slug: utils.slugFromTypeAndCode(r.type || "", r.code || "") || r.slug, code: r.code || r.slug, court: r.type })));
                                    }
                                    if (active?.sources?.kararlar?.length) {
                                        const allProps = active.sources.kararlar.map(k => ({ code: k?.code || "", type: k?.type || "", orijinal_karar_id: k?.id || "", dosya_adi: k?.dosya || "", kaynak_turu: k?.tip || "" }));
                                        const dict = new Map();
                                        allProps.forEach(p => {
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
                                        const list = Array.from(dict.values()).filter(r => r.code || r.court || r.slug).sort((a,b) => (a.court||"").localeCompare(b.court||""));
                                        if(list.length) return renderList(list);
                                    }
                                    return <div className={`p-6 text-center text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Kayıt bulunamadı.</div>;
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

      {/* --- Popovers & Modals (Z-Index 9999) --- */}
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
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmDel({ open: false, id: null })} />
            <div className={`relative w-full max-w-sm border rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 ${isDarkMode ? "bg-[#0f172a] border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/20 text-red-500 mb-4 border border-red-900/50">
                        {icons.trash}
                    </div>
                    <h3 className={`text-lg font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Analizi Sil</h3>
                    <p className={`mt-2 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                         {(() => {
                            const doomed = chats.find(c => c.id === confirmDel.id);
                            const t = (doomed?.title || doomed?.messages?.find(m => m.sender === "user")?.text || "").trim();
                            return t ? `"${t.slice(0, 30)}${t.length > 30 ? "..." : ""}"` : "Seçili analiz";
                        })()} kalıcı olarak silinecek.
                    </p>
                </div>
                <div className="mt-6 flex gap-3">
                    <button onClick={() => setConfirmDel({ open: false, id: null })} className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${isDarkMode ? "text-slate-300 bg-slate-800 hover:bg-slate-700 border-slate-700" : "text-slate-600 bg-slate-100 hover:bg-slate-200 border-slate-200"}`}>İptal</button>
                    <button onClick={() => { const id = confirmDel.id; setConfirmDel({ open: false, id: null }); deleteChatById(id); }} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-900/20 transition-colors">Sil</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}