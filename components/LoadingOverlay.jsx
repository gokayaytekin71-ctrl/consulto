// components/LoadingOverlay.jsx
"use client";
import Lottie from "lottie-react";
import animationData from "../assets/lottie/loading.json";

export default function LoadingOverlay() {
  return (
    // 1. BACKDROP: Koyu, bulanık ve en üst katmanda (z-50 -> z-[9999] yaptık garanti olsun)
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all duration-500">
      
      {/* 2. GLASS CARD CONTAINER */}
      <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900/60 border border-white/10 shadow-2xl shadow-black/50">
        
        {/* Dekoratif Arkadan Vuran Işık (Glow Effect) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500/20 rounded-full blur-[60px] -z-10 animate-pulse"></div>

        {/* Lottie Animasyon */}
        <div className="relative w-32 h-32 md:w-40 md:h-40">
          <Lottie animationData={animationData} loop={true} className="w-full h-full drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
        </div>

        {/* Metin Alanı */}
        <div className="mt-2 text-center space-y-1">
          <h3 className="text-lg font-bold text-white tracking-widest uppercase drop-shadow-md">
            Yükleniyor
          </h3>
          <div className="flex items-center justify-center gap-1">
             <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
             <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
             <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
             <span className="ml-2 text-xs font-mono text-cyan-400/80">Veriler İşleniyor...</span>
          </div>
        </div>

      </div>
    </div>
  );
}