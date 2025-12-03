"use client";

import { useState, useEffect } from "react";

// --- YARDIMCI İKONLAR ---
const IconPDF = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15l3 3 3-3" />
    <path d="M12 12v6" />
  </svg>
);

const IconCalendar = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// --- TARİH ÜRETİCİ ---
function generateRecentDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
}

export default function ResmiGazeteListesi() {
  const [dates, setDates] = useState([]);
  const [visibleCount, setVisibleCount] = useState(9); // Grid için 9 (3x3) daha iyi

  useEffect(() => {
    setDates(generateRecentDates());
  }, []);

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  return (
    // ZEMİN: Projenin genel "Soft Dark" teması (#0f172a)
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans py-16 px-4 md:px-8 selection:bg-red-500/30 overflow-hidden relative">
      
      {/* --- BACKGROUND FX --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Kırmızımsı Resmî Gazete Ruhu */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-xs font-bold text-red-300 uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Dijital Arşiv
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-xl">
            Resmî Gazete
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Günlük yasama, yürütme ve idare bölümü kararlarına PDF formatında hızlı erişim.
          </p>
        </div>

        {/* --- GRID LIST --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dates.slice(0, visibleCount).map((date) => {
            const year = date.getFullYear();
            const monthStr = String(date.getMonth() + 1).padStart(2, "0");
            const dayStr = String(date.getDate()).padStart(2, "0");
            const url = `https://www.resmigazete.gov.tr/eskiler/${year}/${monthStr}/${year}${monthStr}${dayStr}.pdf`;

            // Tarih Formatlama
            const dayName = date.toLocaleDateString("tr-TR", { weekday: "long" });
            const dayNumber = date.getDate();
            const monthName = date.toLocaleDateString("tr-TR", { month: "long" });
            
            // Hafta sonu kontrolü (Cumartesi=6, Pazar=0)
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const today = isToday(date);

            return (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-[#1e293b] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-500/30 hover:bg-[#1e293b]/80 hover:shadow-2xl hover:shadow-red-900/10"
              >
                {/* Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-transparent to-orange-500/0 opacity-0 transition-opacity duration-500 group-hover:from-red-500/5 group-hover:to-orange-500/5 group-hover:opacity-100 pointer-events-none" />

                {/* --- CARD HEADER --- */}
                <div className="flex justify-between items-start mb-6">
                   {/* Date Box */}
                   <div className={`
                      flex flex-col items-center justify-center w-16 h-16 rounded-xl border
                      ${isWeekend 
                        ? "bg-slate-800 border-slate-700 text-slate-400" 
                        : "bg-slate-900 border-slate-700 text-slate-200 group-hover:border-red-500/30 group-hover:text-red-400 transition-colors"}
                   `}>
                      <span className="text-xl font-black leading-none">{dayNumber}</span>
                      <span className="text-[10px] uppercase font-bold mt-1 opacity-70">{monthName.slice(0,3)}</span>
                   </div>

                   {/* Badges */}
                   <div className="flex flex-col items-end gap-2">
                      {today && (
                        <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold uppercase rounded shadow-lg shadow-red-600/20 animate-pulse">
                          Bugün
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-500">{year}</span>
                   </div>
                </div>

                {/* --- CARD CONTENT --- */}
                <div className="mb-4">
                   <h3 className="text-lg font-bold text-white group-hover:text-red-300 transition-colors">
                      {dayName}
                   </h3>
                   <p className="text-sm text-slate-400 mt-1">
                      T.C. Resmî Gazete Yayını
                   </p>
                </div>

                {/* --- CARD FOOTER --- */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-xs font-medium text-slate-500 group-hover:text-slate-300 transition-colors">
                      <IconPDF className="w-4 h-4" />
                      PDF İndir
                   </div>
                   
                   <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                      <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                   </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* --- LOAD MORE BUTTON --- */}
        <div className="mt-12 text-center">
          {visibleCount < dates.length && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 9)}
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-slate-800 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-slate-700 hover:shadow-red-500/20 active:scale-95 border border-white/10 hover:border-red-500/30"
            >
              <span className="relative z-10">Daha Eski Kayıtlar</span>
              <IconCalendar className="relative z-10 w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              
              {/* Button Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}