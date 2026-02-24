"use client";

import { useState } from 'react';

export default function FlashcardsUI({ data }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [flipped, setFlipped] = useState({});
  
  // VARSAYILAN GÖRÜNÜM: 'single' (Tekli Odak)
  const [viewMode, setViewMode] = useState('single');
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleFlip = (id) => {
    setFlipped((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const resetSelection = () => {
    setSelectedCategory(null);
    setSelectedSub(null);
    setFlipped({});
    setViewMode('single'); // Geri dönüldüğünde de tekli modda kalsın
    setCurrentIndex(0);
  };

  const nextCard = (totalCards) => {
    setCurrentIndex((prev) => (prev + 1) % totalCards);
    setFlipped({});
  };

  const prevCard = (totalCards) => {
    setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
    setFlipped({});
  };

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
        <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        <p className="text-slate-600 font-medium text-center">Sistemde henüz bir bilgi kartı bulunmuyor.<br/><span className="text-sm text-slate-400 font-normal mt-1 block">"data/flashcards" klasörüne içerik eklemelisiniz.</span></p>
      </div>
    );
  }

  // =========================================================================
  // 1. EKRAN: ANA KATEGORİ SEÇİMİ (Klas ve Profesyonel Görünüm)
  // =========================================================================
  if (!selectedCategory) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {Object.keys(data).map(category => (
          <button 
            key={category}
            onClick={() => setSelectedCategory(category)}
            className="group relative flex flex-col justify-between p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-[#001f3f] transition-all duration-300 text-left overflow-hidden min-h-[160px]"
          >
            {/* Consulto Mavi Üst Çizgi Efekti */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            
            <div>
              <h3 className="text-xl font-bold text-[#001f3f] mb-3 leading-snug">{category}</h3>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
                <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                {Object.keys(data[category]).length} Modül
              </p>
              <span className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-[#001f3f] group-hover:text-white transition-colors">
                &rarr;
              </span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // =========================================================================
  // 2. EKRAN: ALT KATEGORİ (KART SETİ) SEÇİMİ
  // =========================================================================
  if (!selectedSub) {
    return (
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={resetSelection} 
          className="mb-6 flex items-center text-xs font-bold text-slate-400 hover:text-[#001f3f] transition-colors tracking-widest uppercase"
        >
          &larr; Ana Kategorilere Dön
        </button>
        
        <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-5">
          <div className="w-1.5 h-8 bg-cyan-500 rounded-full"></div>
          <h2 className="text-3xl font-extrabold text-[#001f3f] tracking-tight">
            {selectedCategory}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {Object.keys(data[selectedCategory]).map(sub => {
             const cardCount = data[selectedCategory][sub].length;
             return (
              <button 
                key={sub}
                onClick={() => setSelectedSub(sub)}
                disabled={cardCount === 0}
                className={`p-6 rounded-xl border text-left transition-all flex flex-col justify-between h-full min-h-[150px] ${
                  cardCount > 0 
                    ? 'bg-white shadow-sm hover:shadow-md hover:border-cyan-500 border-slate-200 cursor-pointer group relative overflow-hidden' 
                    : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed opacity-70'
                }`}
              >
                {cardCount > 0 && <div className="absolute right-0 top-0 w-16 h-16 bg-slate-50 rounded-bl-full -z-0 group-hover:bg-cyan-50 transition-colors"></div>}
                
                <span className="block text-lg font-bold text-[#001f3f] group-hover:text-cyan-700 transition-colors leading-snug mb-6 relative z-10">
                  {sub}
                </span>
                
                <div className="flex items-center justify-between relative z-10">
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                    {cardCount > 0 ? `${cardCount} Kart` : 'Boş Set'}
                  </span>
                  {cardCount > 0 && (
                     <span className="text-cyan-600 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all font-medium text-sm">
                       Çalışmaya Başla &rarr;
                     </span>
                  )}
                </div>
              </button>
             );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. EKRAN: KARTLARIN GÖSTERİMİ (Premium Tasarım)
  // =========================================================================
  const cards = data[selectedCategory][selectedSub];
  const totalCards = cards.length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Üst Bilgi ve Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-6 gap-4">
        <div>
          <button 
            onClick={() => { setSelectedSub(null); setFlipped({}); setViewMode('single'); setCurrentIndex(0); }} 
            className="mb-3 flex items-center text-xs font-bold text-slate-400 hover:text-[#001f3f] transition-colors tracking-widest uppercase"
          >
            &larr; {selectedCategory} Modüllerine Dön
          </button>
          <h2 className="text-3xl font-extrabold text-[#001f3f] leading-tight flex items-center gap-3">
            {selectedSub}
          </h2>
        </div>
        
        {/* Şık Segmentli Kontrol (Görünüm Seçici) */}
        <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200/60 shadow-inner">
          <button
            onClick={() => setViewMode('single')}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === 'single' ? 'bg-white text-[#001f3f] shadow shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Tekli Odak
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-[#001f3f] shadow shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Tümü ({totalCards})
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          GÖRÜNÜM 1: SINGLE (TEKLİ ODAK - VARSAYILAN)
          ---------------------------------------------------------------------- */}
      {viewMode === 'single' && (
        <div className="max-w-3xl mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
          
          {/* İlerleme Çubuğu */}
          <div className="w-full mb-8">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">İlerleme</span>
              <span className="text-xs font-bold text-[#001f3f] bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">{currentIndex + 1} / {totalCards}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-500 ease-out" 
                 style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
               ></div>
            </div>
          </div>

          {/* Flashcard (Tekli) */}
          <div 
            className="w-full h-[400px] sm:h-[450px] [perspective:1500px] cursor-pointer group"
            onClick={() => handleFlip(cards[currentIndex].id)}
          >
            <div className={`relative h-full w-full transition-all duration-700 [transform-style:preserve-3d] ${flipped[cards[currentIndex].id] ? '[transform:rotateY(180deg)]' : ''}`}>
              
              {/* ÖN YÜZ (Soru) */}
              <div className="absolute inset-0 h-full w-full rounded-2xl bg-white p-8 sm:p-12 [backface-visibility:hidden] flex flex-col items-center justify-center border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                
                {/* Sol üst zarif numara */}
                <div className="absolute top-6 left-6 text-sm font-bold text-slate-300">
                  {String(currentIndex + 1).padStart(2, '0')}
                </div>

                <div className="flex-1 flex items-center justify-center w-full overflow-y-auto custom-scrollbar my-4">
                  <p className="text-xl sm:text-2xl font-bold text-[#001f3f] text-center leading-relaxed max-w-xl">
                    {cards[currentIndex].question}
                  </p>
                </div>
                
                <p className="text-xs text-slate-400 font-bold tracking-widest uppercase flex items-center gap-2 mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                  Cevabı Gör
                </p>
              </div>

              {/* ARKA YÜZ (Cevap - Consulto Laciverti) */}
              <div className="absolute inset-0 h-full w-full rounded-2xl bg-[#001f3f] p-8 sm:p-12 text-center text-white [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center shadow-[0_15px_40px_rgba(0,31,63,0.2)] border border-[#0a2e5c]">
                
                <div className="w-full flex justify-center mb-6">
                  <span className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-cyan-300 border border-white/5">
                    Hukuki Yanıt
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center w-full overflow-y-auto custom-scrollbar pr-2">
                  <p className="text-lg sm:text-xl font-normal leading-relaxed text-slate-100 text-left md:text-center w-full">
                    {cards[currentIndex].answer}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kontrol Butonları */}
          <div className="flex justify-between w-full mt-10 gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); prevCard(totalCards); }}
              className="px-6 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 hover:text-[#001f3f] transition-all flex items-center justify-center gap-3 w-40"
            >
              &larr; Önceki
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextCard(totalCards); }}
              className="px-6 py-4 bg-[#001f3f] text-white font-bold rounded-xl shadow-md shadow-slate-900/10 hover:bg-blue-900 transition-all flex items-center justify-center gap-3 flex-1 max-w-[200px]"
            >
              Sonraki &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          GÖRÜNÜM 2: GRID (TÜMÜ) 
          ---------------------------------------------------------------------- */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
          {cards.map((card) => (
            <div
              key={card.id}
              className="group h-[320px] [perspective:1500px] cursor-pointer"
              onClick={() => handleFlip(card.id)}
            >
              <div className={`relative h-full w-full rounded-2xl transition-all duration-700 [transform-style:preserve-3d] ${flipped[card.id] ? '[transform:rotateY(180deg)]' : 'shadow-sm hover:shadow-xl'}`}>
                
                {/* ÖN YÜZ */}
                <div className="absolute inset-0 h-full w-full rounded-2xl bg-white p-8 [backface-visibility:hidden] flex flex-col items-center justify-center border border-slate-200">
                  <div className="absolute top-4 left-4 text-xs font-bold text-slate-300">
                    {String(card.id + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 w-full flex items-center justify-center overflow-y-auto custom-scrollbar">
                    <p className="text-base font-bold text-[#001f3f] text-center leading-snug">
                      {card.question}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-4">Dokun ve Çevir</p>
                </div>

                {/* ARKA YÜZ */}
                <div className="absolute inset-0 h-full w-full rounded-2xl bg-[#001f3f] p-8 text-center text-white [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center shadow-lg border border-[#0a2e5c]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 mb-4 block w-full shrink-0">Yanıt</span>
                  <div className="flex-1 w-full overflow-y-auto custom-scrollbar pr-1 text-left">
                    <p className="text-sm font-medium leading-relaxed text-slate-100">{card.answer}</p>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}