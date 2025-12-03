"use client";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useAnalysisBot } from "../hooks/useAnalysisBot";
import TokenBalance from "@/components/TokenBalance"; // <-- YENİ EKLENDİ

// --- UI Bileşenleri ---

// 1. Cyber Loader
const CyberLoader = () => {
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
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900/50 backdrop-blur-sm rounded-xl border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-cyan-900/30 rounded-full animate-spin-slow"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-cyan-400 rounded-full animate-spin"></div>
        <div className="absolute top-2 left-2 w-12 h-12 border-b-4 border-indigo-500 rounded-full animate-pulse"></div>
      </div>
      <div className="mt-6 flex flex-col items-center gap-2">
        <span className="text-xs font-mono text-cyan-400 tracking-[0.2em] animate-pulse">AI PROCESSING</span>
        <span className="text-[10px] font-mono text-slate-400">{messages[msgIndex]}</span>
      </div>
      <div className="w-48 h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500 w-full animate-shimmer"></div>
      </div>
    </div>
  );
};

// 2. Premium Kart Yapısı
const PremiumCard = ({ title, icon, children, className = "", noPadding = false, action }) => (
  <div className={`relative flex flex-col bg-[#0f172a]/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:border-cyan-500/30 hover:shadow-cyan-500/10 ${className}`}>
    {(title || icon) && (
      <div className="flex-none flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-3">
          {icon && <div className="text-cyan-400 drop-shadow-md">{icon}</div>}
          <h3 className="text-xs font-bold tracking-widest text-slate-200 uppercase font-mono">{title}</h3>
        </div>
        {action}
      </div>
    )}
    <div className={`flex-1 min-h-0 relative ${noPadding ? "" : "p-5"}`}>{children}</div>
    {/* Dekoratif Köşe */}
    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
  </div>
);

// 3. Mevzuat Popover (Overlay Olmadan - Click Outside ile Kapanan)
const MevzuatPopover = ({ data, position, onClose }) => {
  if (!data || !position) return null;
  
  return (
    <div 
      data-mevzuat-popover="1" 
      className="fixed z-[9999] w-[450px] max-w-[90vw] flex flex-col bg-[#0B1120] border border-cyan-500/30 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200"
      style={{
        top: position.top,
        left: position.left,
        transform: "translate(-50%, 0)"
      }}
      onClick={(e) => e.stopPropagation()} 
    >
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-950 to-transparent border-b border-cyan-900/50 rounded-t-xl">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
           <span className="text-xs font-bold text-cyan-100 uppercase tracking-wider font-mono">
             {data.mevzuat_adi} {data.madde ? `m.${data.madde}` : ''}
           </span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar">
        <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
          {data.preview}
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-cyan-500/50 via-indigo-500/50 to-transparent opacity-50"></div>
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

  const onDeleteClick = (e, id) => { 
    e?.stopPropagation(); 
    if (id) setConfirmDel({ open: true, id }); 
  };

  const icons = {
    bot: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
    send: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>,
    plus: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>,
    trash: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    book: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    scale: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-100 font-sans overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-100">
      
      {/* Global Style overrides */}
      <style jsx global>{`
        footer, .footer { display: none !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2s infinite linear; }
        
        @keyframes pulse-slow { 0%, 100% { opacity: 0.1; transform: scale(1); } 50% { opacity: 0.2; transform: scale(1.1); } }
        .animate-pulse-slow { animation: pulse-slow 8s infinite ease-in-out; }
      `}</style>

      {/* Arkaplan */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header - Z-Index 50 */}
      <header className="flex-none z-50 h-16 border-b border-white/5 bg-[#020617]/70 backdrop-blur-xl flex items-center justify-between px-6 shadow-lg shadow-black/20">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer">
             <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-200"></div>
             <div className="relative w-10 h-10 bg-[#0f172a] rounded-lg border border-slate-700 flex items-center justify-center text-cyan-400 shadow-xl">
               {icons.scale}
             </div>
          </div>
          <div className="flex flex-col">
             <h1 className="text-lg font-bold tracking-tight text-white leading-none">
               Analiz <span className="text-cyan-500 font-light">AI</span>
             </h1>
             <span className="text-[10px] text-cyan-600/80 font-mono tracking-[0.2em] uppercase mt-1">Legal Intellıgence System v2.0</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 gap-3">
             <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span>ONLINE</span>
             <span className="w-px h-3 bg-slate-700"></span>
             <span>VERİ TABANI: GÜNCEL</span>
          </div>
        </div>
      </header>

      {/* --- Main Layout --- */}
      <div className="flex-1 flex overflow-hidden relative z-10 px-6 py-6 gap-6">
        
        {/* SOL: Geçmiş Analizler Sidebar - Z-Index 40 */}
        <aside className="w-[300px] flex-none z-40 flex flex-col">
          <PremiumCard className="h-full bg-[#020617]/80 backdrop-blur-sm" noPadding>
            <div className="flex flex-col h-full">
              
              {/* --- TOKEN BAKİYESİ --- */}
              <div className="pt-4">
                 <TokenBalance />
              </div>
              {/* ------------------- */}

              <div className="p-5 space-y-4 flex-none">
                <button 
                  onClick={() => { const c = createEmptyAnalysis(""); setActiveId(c.id); }}
                  className="group relative w-full flex items-center justify-center gap-2 overflow-hidden bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-800/50 hover:border-cyan-500 text-cyan-100 text-sm font-medium py-3 rounded-xl transition-all duration-300"
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
                    className="w-full bg-[#0f172a] border border-slate-800 rounded-lg py-2.5 px-4 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
                <div className="space-y-1">
                  {filteredChats.map(item => {
                    const isActive = item.id === activeId;
                    const title = utils.cleanTitle(item.title) || (item.messages?.find(m => m.sender === "user")?.text || "Başlıksız");
                    return (
                      <div 
                        key={item.id}
                        onClick={() => setActiveId(item.id)}
                        className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 border ${isActive ? "bg-slate-800/80 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "border-transparent hover:bg-slate-800/40 hover:border-slate-800"}`}
                      >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className={`text-xs font-medium truncate mb-1 ${isActive ? "text-cyan-100" : "text-slate-400 group-hover:text-slate-200"}`}>{title}</h4>
                              <span className="text-[10px] text-slate-600 font-mono">{new Date(item.createdAt || Date.now()).toLocaleDateString('tr-TR')}</span>
                            </div>
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>}
                          </div>
                          <button 
                            onClick={(e) => onDeleteClick(e, item.id)}
                            className={`absolute right-2 bottom-2 p-1.5 rounded bg-slate-900/80 text-slate-500 hover:text-red-400 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all z-10`}
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

        {/* ORTA: Chat & Analiz Alanı - Z-Index 10 */}
        <main className="flex-1 overflow-y-auto custom-scrollbar min-w-0 bg-transparent z-10">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
              
              {/* Soru Alanı */}
              <PremiumCard className="z-10 bg-gradient-to-b from-[#0f172a] to-[#0B1120]">
                  <form onSubmit={handleAnalyze} className="relative">
                      <textarea 
                          disabled={isLoading}
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          placeholder="Hukuki meseleyi, dava türünü ve delil durumunu buraya detaylıca yazın..." 
                          className={`w-full bg-[#020617] border border-slate-800 rounded-xl p-4 min-h-[120px] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 focus:shadow-[0_0_20px_rgba(6,182,212,0.05)] transition-all resize-y ${isLoading ? "opacity-30 pointer-events-none" : ""}`}
                      />
                      
                      {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center z-20">
                            <CyberLoader />
                          </div>
                      )}

                      <div className="flex items-center justify-between mt-4">
                          <div className="flex gap-2">
                              {["YARGITAY", "BAM", "ANAYASA", "MEVZUAT"].map(tag => (
                                  <span key={tag} className="text-[9px] font-mono text-cyan-900 bg-cyan-900/10 border border-cyan-900/20 px-2 py-1 rounded select-none">
                                    {tag}
                                  </span>
                              ))}
                          </div>
                          <div className="flex gap-3">
                              {input && !isLoading && (
                                  <button type="button" onClick={() => setInput("")} className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">Vazgeç</button>
                              )}
                              <button 
                                  type="submit" 
                                  disabled={isLoading || !input.trim()}
                                  className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-bold tracking-wide rounded-lg shadow-lg shadow-cyan-900/30 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:shadow-none transition-all duration-300 overflow-hidden"
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
                        {activeUserQuery && (
                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#0f172a]/40 border border-dashed border-slate-700/50">
                                <div className="shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-400 text-xs font-bold">SORGU:</div>
                                <div className="text-sm text-slate-300 leading-relaxed font-light">{activeUserQuery}</div>
                            </div>
                        )}

                        <PremiumCard className="min-h-[400px]" noPadding>
                          <div className="p-8">
                            <div className="prose prose-invert max-w-none 
                                prose-p:text-slate-300 prose-p:leading-7 prose-p:font-light
                                prose-headings:text-cyan-50 prose-headings:font-semibold prose-headings:tracking-tight
                                prose-strong:text-cyan-200 prose-strong:font-bold
                                prose-li:text-slate-300
                                prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-cyan-300
                                prose-blockquote:border-l-cyan-500 prose-blockquote:bg-cyan-950/10 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:text-cyan-100 prose-blockquote:not-italic
                            ">
                                {activeMarkdown ? (
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]} 
                                        rehypePlugins={[rehypeRaw]} 
                                        components={{
                                            a: ({node, ...props}) => {
                                                const isCitation = props.href && props.href.startsWith("/kararlar/");
                                                if(isCitation) {
                                                    return (
                                                        <a {...props} target="_blank" className="inline-flex items-center justify-center min-w-[20px] px-1.5 h-5 mx-0.5 rounded text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all no-underline align-middle">
                                                            {props.children}
                                                        </a>
                                                    );
                                                }
                                                return <a {...props} />;
                                            }
                                        }}
                                    >
                                        {activeMarkdown}
                                    </ReactMarkdown>
                                ) : (
                                    !isLoading && <div className="flex flex-col items-center justify-center py-20 opacity-50"><span className="text-4xl mb-4">⚖️</span><p>Analiz sonucu bekleniyor...</p></div>
                                )}
                            </div>
                          </div>
                        </PremiumCard>
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-slate-600 bg-[#0f172a]/30 rounded-3xl border border-dashed border-slate-800">
                      <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mb-6 shadow-inner border border-slate-800"><span className="text-cyan-900/40 text-4xl">{icons.scale}</span></div>
                      <h3 className="text-xl font-bold text-slate-400 mb-2">Sistem Hazır</h3>
                      <p className="text-sm text-slate-500 max-w-xs text-center">Hukuki analiz motorunu başlatmak için sol menüden yeni bir analiz oluşturun.</p>
                  </div>
              )}
          </div>
        </main>

        {/* SAĞ: Kaynaklar Sidebar - Z-Index 40 */}
        <aside className="hidden lg:flex w-[350px] flex-none flex-col h-full z-40">
            <PremiumCard className="h-full bg-[#020617]/50 backdrop-blur-sm" noPadding>
              <div className="flex flex-col h-full">
                
                {/* Mevzuat Bölümü */}
                <div className="flex-shrink-0 h-[45%] flex flex-col min-h-0 border-b border-white/5">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2 flex-none">
                        <div className="text-cyan-400">{icons.book}</div>
                        <h3 className="text-xs font-bold tracking-widest text-slate-200 uppercase">İlgili Mevzuat</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="divide-y divide-white/5">
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
                                        className="group/item relative hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <div className="p-4 flex gap-3 items-start">
                                            {m.madde && (
                                                <button type="button" className={`shrink-0 flex items-center justify-center w-10 h-8 rounded text-[10px] font-bold border transition-all ${openMevzuat?.key === popKey ? "bg-cyan-500 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]" : "bg-slate-900 text-slate-400 border-slate-700 group-hover/item:border-cyan-500/50 group-hover/item:text-cyan-400"}`}>
                                                    m.{m.madde}
                                                </button>
                                            )}
                                            <div className="min-w-0 flex-1 pt-1">
                                                <div className="text-xs font-medium text-slate-300 group-hover/item:text-white transition-colors">{m.mevzuat_adi}</div>
                                            </div>
                                        </div>
                                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-500 opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                                    </div>
                                );
                            }) : <div className="p-6 text-center text-xs text-slate-500">Kayıt bulunamadı.</div>}
                        </div>
                    </div>
                </div>

                {/* Kararlar Bölümü */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2 flex-none">
                        <div className="text-cyan-400">{icons.bot}</div>
                        <h3 className="text-xs font-bold tracking-widest text-slate-200 uppercase">Emsal Kararlar</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="divide-y divide-white/5">
                            {(() => {
                                const renderList = (items) => items.map((r, i) => (
                                    <div key={i} className="p-4 hover:bg-white/5 transition-colors group/karar">
                                        <div className="flex flex-col gap-1">
                                            {r.court && <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{r.court}</span>}
                                            {r.slug && utils.looksLikeSlug(r.slug) ? (
                                                <a href={`/kararlar/${encodeURIComponent(r.slug)}`} target="_blank" className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline decoration-cyan-500/30 underline-offset-4 transition-all">
                                                    {r.code || r.slug}
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-300">{r.code || r.slug}</span>
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
                                return <div className="p-6 text-center text-xs text-slate-500">Kayıt bulunamadı.</div>;
                            })()}
                        </div>
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
          />
      )}

      {confirmDel.open && (
         <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmDel({ open: false, id: null })} />
            <div className="relative w-full max-w-sm bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/20 text-red-500 mb-4 border border-red-900/50">
                        {icons.trash}
                    </div>
                    <h3 className="text-lg font-bold text-slate-100">Analizi Sil</h3>
                    <p className="mt-2 text-sm text-slate-400">
                         {(() => {
                            const doomed = chats.find(c => c.id === confirmDel.id);
                            const t = (doomed?.title || doomed?.messages?.find(m => m.sender === "user")?.text || "").trim();
                            return t ? `"${t.slice(0, 30)}${t.length > 30 ? "..." : ""}"` : "Seçili analiz";
                        })()} kalıcı olarak silinecek.
                    </p>
                </div>
                <div className="mt-6 flex gap-3">
                    <button onClick={() => setConfirmDel({ open: false, id: null })} className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700">İptal</button>
                    <button onClick={() => { const id = confirmDel.id; setConfirmDel({ open: false, id: null }); deleteChatById(id); }} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-900/20 transition-colors">Sil</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}