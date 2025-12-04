"use client";

import { useState } from "react";

export default function MobileFilterDrawer({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* MOBİL FİLTRE BUTONU */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-medium mb-6 shadow-sm active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filtreleme & Sıralama</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>

      {/* DRAWER / OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Arkaplan Karartma */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Panel */}
          <div className="absolute inset-y-0 right-0 w-full sm:w-[350px] bg-slate-900 border-l border-slate-700 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100">Filtreler</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900">
               <button 
                 onClick={() => setIsOpen(false)}
                 className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors"
               >
                 Sonuçları Göster
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}