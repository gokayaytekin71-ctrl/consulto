// components/LoadingOverlay.jsx
"use client";
import Lottie from "lottie-react";
import animationData from "../assets/lottie/loading.json";

export default function LoadingOverlay() {
  return (
    // 1. BACKDROP: Tam ekran, ultra koyu arka plan ve yüksek bulanıklık
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-black/90 backdrop-blur-2xl transition-all duration-700">
      
      {/* 2. AMBİYANS IŞIKLARI (Arka Planda Yüzen Renk Dalgaları) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse duration-1000"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-cyan-600/10 blur-[120px] animate-pulse duration-[3000ms]"></div>
      </div>

      {/* 3. ANA MERKEZ (Halkalar ve Lottie) */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Şovlu Yüzük Konteyneri */}
        <div className="relative flex items-center justify-center mb-10">
          
          {/* Dışarıdaki Neon Çizgi (Saat Yönünde Dönüyor) */}
          <div className="absolute inset-[-1rem] rounded-full border border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin [animation-duration:3s] opacity-70"></div>
          
          {/* İçerideki Neon Çizgi (Ters Yönde Dönüyor) */}
          <div className="absolute inset-[-0.5rem] rounded-full border border-b-indigo-500 border-l-purple-500 border-t-transparent border-r-transparent animate-spin [animation-direction:reverse] [animation-duration:2s] opacity-70"></div>

          {/* İç Çekirdek Lottie Yuvası */}
          <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full bg-slate-950/50 shadow-[0_0_50px_rgba(99,102,241,0.2)] border border-white/5 flex items-center justify-center p-4 backdrop-blur-sm">
            {/* Lottie Animasyonun Arkasındaki Glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 blur-xl animate-pulse"></div>
            
            <Lottie 
              animationData={animationData} 
              loop={true} 
              className="relative z-20 w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" 
            />
          </div>
        </div>

        {/* 4. TİPOGRAFİ VE YÜKLEME ÇUBUĞU */}
        <div className="flex flex-col items-center space-y-5">
          
          {/* Gradient Başlık */}
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 drop-shadow-lg">
            Yükleniyor
          </h2>
          
          {/* Fütüristik İnce Yükleme Çubuğu */}
          <div className="w-56 md:w-72 h-1 bg-slate-800/80 rounded-full overflow-hidden relative shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-cyan-400 to-indigo-500 origin-left animate-pulse"></div>
            <div className="absolute inset-y-0 left-0 w-1/3 bg-white/40 blur-[2px] animate-[slide_1.5s_ease-in-out_infinite_alternate]"></div>
          </div>

          {/* Terminal Stili Alt Metin */}
          <div className="flex items-center gap-2 text-xs md:text-sm font-mono text-cyan-200/50 tracking-widest">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></span>
            SİSTEM BAŞLATILIYOR...
          </div>

        </div>
      </div>
    </div>
  );
}