"use client";
 
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";
import Link from "next/link";

// Nitelik çubuğunun doluluk oranını hesaplamak için bir maksimum uzunluk belirleyelim.
// Bu değer, tüm kararlarınızın ortalama veya en uzunlarına göre ayarlanabilir.
const MAX_CONTENT_LENGTH_FOR_BAR = 50000; // Örnek bir maksimum değer, bunu verilerinize göre ayarlayın.
                                        // Daha dinamik bir yaklaşım için, tüm kararların max/min contentLength
                                        // değerlerini alıp bir ölçeklendirme yapılabilir.

export default function DecisionCard({
  id,
  type,
  code,
  aiSummary,
  keywords,
  contentLength = 0,
  matches = [],
  terms = []
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const aiSummaryIconPath = "M12 18.75a6 6 0 006-6v-1.5a.75.75 0 011.5 0v1.5a7.5 7.5 0 11-15 0v-1.5a.75.75 0 011.5 0v1.5a6 6 0 006 6zM12 9a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75V11.25a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V9z";

  const keywordList = typeof keywords === 'string' 
    ? keywords.split(',')
        .map(kw => kw.trim())
        .filter(kw => kw.length > 0)
    : [];

  // Nitelik puanını ve metnini hesapla
  const qualityPercentage = Math.min(100, Math.max(0, (contentLength / MAX_CONTENT_LENGTH_FOR_BAR) * 100));
  let qualityText = "";
  let barColorClass = "";

  if (qualityPercentage < 20) {
    qualityText = "Düşük";
    barColorClass = "bg-red-500";
  } else if (qualityPercentage < 50) {
    qualityText = "Orta";
    barColorClass = "bg-yellow-500"; // Orta için sarı renk
  } else {
    qualityText = "Yüksek";
    barColorClass = "bg-green-500";
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden h-full">
      {/* BAŞLIK BÖLÜMÜ (Önceki gibi) */}
      <div className="bg-gradient-to-b from-[#001f3f] to-[#004365] px-6 py-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white truncate" title={type}>
          {type}
        </h2>
        {code && (
          <p className="text-xs text-[#BFDFFF] mt-0.5 ml-2 whitespace-nowrap" title={code}>
            {code}
          </p>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1 space-y-4">
        
        {/* GÜNCELLENMİŞ NİTELİK GÖSTERGESİ */}
        <div className="w-full mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1"> {/* mb-0.5'ten mb-1'e */}
            <span>Karar Niteliği</span>
            <span>Nitelik Puanı : {Math.round(qualityPercentage)}</span> {/* YENİ: Puan gösterimi */}
          </div>
          {/* Çubuk ve ortalanmış metin için bir wrapper */}
          <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 relative"> {/* h-2.5'ten h-4'e */}
            <div 
              className={`${barColorClass} h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-center`} 
              style={{ width: `${qualityPercentage}%` }}
              title={`Karar uzunluğu: ${contentLength} karakter`}
            >
              {/* Metni çubuğun üzerine ortalamak için */}
              {/* Sadece çubuk yeterince genişse metni göster (opsiyonel) */}
              {qualityPercentage > 10 && ( // Veya her zaman göster
                 <span className="text-xs font-medium text-white px-1 leading-none"> {/* leading-none eklendi */}
                    {qualityText}
                 </span>
              )}
            </div>
            {/* Eğer çubuk çok kısaysa ve metin sığmıyorsa, metni çubuğun dışına (sağına veya altına) koyabiliriz. */}
            {/* Alternatif: Metni her zaman çubuğun ortasında göstermek için (çubuk kısa olsa bile) */}
            {qualityPercentage <= 10 && (
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-medium ${qualityPercentage > 5 ? 'text-white' : 'text-gray-600'} px-1 leading-none`}>
                        {qualityText}
                    </span>
                 </div>
            )}
          </div>
        </div>

        {/* Anahtar Kelimeler Bölümü (Önceki gibi) */}
        {keywordList.length > 0 && (
          // ... (Anahtar kelimeler JSX'i) ...
          <div className="mb-2">
            <div className="flex flex-wrap gap-2">
              {keywordList.map((kw, index) => (
                <Link
                  key={index}
                  href={`/kararlar?q=${encodeURIComponent(kw)}&page=1`}
                  className="bg-sky-100 text-sky-700 px-2.5 py-0.5 rounded-full text-xs font-medium hover:bg-sky-200 hover:text-sky-800 transition-colors cursor-pointer"
                >
                  {kw}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI Özeti Bölümü (Önceki gibi) */}
        {aiSummary && (
          // ... (AI Özeti JSX'i) ...
          <div>
            <h3 className="flex items-center text-sm font-medium text-blue-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={aiSummaryIconPath} />
              </svg>
              AI Özeti
            </h3>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2 max-h-40 overflow-y-auto pr-1">
              {(aiSummary || "").split(/\r?\n/).map((line,idx) => {
                const trimmedLine = line.trim();
                let matchedPrefix = null;
                let displayText = trimmedLine;
                const prefixes = ['1) Konu:', 'Konu:', '2) HGK Gerekçesi ve Sonuç:', 'HGK Gerekçesi ve Sonuç:', '2) HGK Gerekçesi: Sonuç:', 'HGK Gerekçesi: Sonuç:', 'HGK Gerekçesi:', 'Sonuç:', 'Gerekçe ve Sonuç:', 'Uyuşmazlık:'];
                for (const prefix of prefixes) {
                  if (trimmedLine.startsWith(prefix)) {
                    matchedPrefix = prefix;
                    displayText = trimmedLine.substring(matchedPrefix.length).trim();
                    break;
                  }
                }
                if (matchedPrefix) {
                  return (<p key={idx}><span className="font-semibold text-blue-700">{matchedPrefix}</span>{' '}{displayText}</p>);
                } else {
                  return <p key={idx}>{line}</p>;
                }
              })}
            </div>
          </div>
        )}
        
        {/* Eşleşen Cümleler (varsa) - Bu kısım aynı kalıyor */}
        {/* ... */}

        {/* Detay Butonu (Önceki gibi) */}
       <div className="mt-auto pt-4">
        <>
          {isPending && <LoadingOverlay />}
          <button
            onClick={(e) => {
              e.preventDefault();
              startTransition(() => {
                router.push(`/kararlar/${id}`);
              });
            }}
            className="block w-full text-center bg-orange-500 text-white font-medium py-2.5 rounded-lg hover:bg-orange-600 transition-colors duration-150 shadow hover:shadow-md"
          >
            Tam Karar Metnini Gör
          </button>
        </>
       </div>
      </div>
    </div>
  );
}
