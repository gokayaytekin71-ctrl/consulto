// components/KararAramaKutusu.jsx
"use client";

import { useState, useTransition, useEffect } from 'react'; // useEffect eklendi
import { useRouter } from 'next/navigation';
import LoadingOverlay from "./LoadingOverlay";

// Animasyon için yazılıp silinecek metinler
const placeholderPhrases = [
  "Kıdem tazminatı unsurları...",
  "İşe iade davasında alt işveren...",
  "Boşanma sebebi ıslahla değiştirilebilir mi...",
  "Boşanma sonrası düğünde takılan takılar ...",
  "Trafik kazası sonucu tazminatlar..."
];

// Animasyon hız ayarları
const TYPING_SPEED = 100; // ms cinsinden yazma hızı
const PAUSE_DURATION = 2000; // ms cinsinden bekleme süresi
const DELETING_SPEED = 30; // ms cinsinden silme hızı

export default function KararAramaKutusu({
  defaultQuery = '',
  basePath = '/kararlar'
}) {
  const [aramaMetni, setAramaMetni] = useState(defaultQuery);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // --- YENİ EKLENEN ANİMASYON STATE'LERİ ---
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // --- ANİMASYON MANTIĞI (useEffect) ---
   useEffect(() => {
    // EĞER KULLANICI ARAMA KUTUSUNA BİR ŞEYLER YAZDIYSA ANİMASYONU DURDUR
    if (aramaMetni) {
      setCurrentPlaceholder(''); // Animasyonlu metni temizle
      return; // Döngüyü sonlandır
    }

    const handleTyping = () => {
      const fullPhrase = placeholderPhrases[placeholderIndex];

      // Silme modunda mıyız, yoksa yazma modunda mı?
      if (isDeleting) {
        // Metni birer birer sil
        setCurrentPlaceholder(fullPhrase.substring(0, currentPlaceholder.length - 1));
      } else {
        // Metni birer birer yaz
        setCurrentPlaceholder(fullPhrase.substring(0, currentPlaceholder.length + 1));
      }

      // Durumları kontrol et ve bir sonraki adıma geç
      if (!isDeleting && currentPlaceholder === fullPhrase) {
        // Yazma bitti, beklemeye geç ve sonra silmeyi başlat
        setTimeout(() => setIsDeleting(true), PAUSE_DURATION);
      } else if (isDeleting && currentPlaceholder === '') {
        // Silme bitti, bir sonraki metne geç
        setIsDeleting(false);
        setPlaceholderIndex((prev) => (prev + 1) % placeholderPhrases.length);
      }
    };
      // ... (animasyon mantığının geri kalanı aynı)
  

    const typingTimeout = setTimeout(handleTyping, isDeleting ? DELETING_SPEED : TYPING_SPEED);

    return () => clearTimeout(typingTimeout);
  }, [currentPlaceholder, isDeleting, placeholderIndex]);


  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (aramaMetni.trim()) params.set('q', aramaMetni.trim());
    startTransition(() => router.push(`${basePath}?${params.toString()}`));
  };

  return (
    <>
      {isPending && <LoadingOverlay />}
      <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex space-x-3 items-center animate-fadeIn">
        <div className="flex items-center flex-1 bg-slate-800/70 rounded-full border border-slate-700 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 mx-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          
          {/* DEĞİŞİKLİK: placeholder dinamik state ile değiştirildi */}
          {/* Yanıp sönen bir imleç efekti için dikey çizgi | eklendi */}
          <input
            type="text"
            value={aramaMetni}
            onChange={e => setAramaMetni(e.target.value)}
            placeholder={currentPlaceholder + '|'}
            className="w-full h-12 bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none pr-4"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-3 bg-sky-600 text-white font-semibold rounded-full shadow-md hover:bg-sky-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isPending ? 'Aranıyor...' : 'Ara'}
        </button>
      </form>
    </>
  );
}