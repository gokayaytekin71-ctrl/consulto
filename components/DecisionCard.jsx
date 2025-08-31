"use client";

import Link from "next/link";
import FormattedSummary from "@/components/FormattedSummary";

const MAX_CONTENT_LENGTH_FOR_BAR = 90000;

export default function DecisionCard({
  id,
  type,
  code,
  aiSummary,
  keywords,
  contentLength = 0,
}) {
  const aiSummaryIconPath = "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.197-.398a2.25 2.25 0 001.423-1.423L16.5 15.75l.398 1.197a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.197.398a2.25 2.25 0 00-1.423 1.423z";

  const keywordList = typeof keywords === 'string'
    ? keywords.split(',').map(kw => kw.trim()).filter(Boolean)
    : [];

  const qualityPercentage = Math.min(100, Math.max(0, (contentLength / MAX_CONTENT_LENGTH_FOR_BAR) * 100));
  let qualityText = "";
  let barColorClass = "";

  if (qualityPercentage < 30) {
    qualityText = "Kısa";
    barColorClass = "bg-red-500";
  } else if (qualityPercentage < 60) {
    qualityText = "Orta";
    barColorClass = "bg-yellow-500";
  } else {
    qualityText = "Uzun";
    barColorClass = "bg-green-500";
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden h-full text-sm">
      <div className="bg-gradient-to-b from-[#001f3f] to-[#004365] px-4 py-3 flex justify-between items-center">
        <h2 className="text-base font-semibold text-white truncate" title={type}>{type}</h2>
        {code && (<p className="text-sm text-[#BFDFFF] mt-0.5 ml-2 whitespace-nowrap" title={code}>{code}</p>)}
      </div>

      <div className="py-4 px-6 flex flex-col flex-1 space-y-6">
        {/* Uzunluk Göstergesi */}
        <div className="w-full mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Karar Uzunluğu</span>
            
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 relative">
            <div
              className={`${barColorClass} h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-center`}
              style={{ width: `${qualityPercentage}%` }}
              title={`Karar uzunluğu: ${contentLength} karakter`}
            >
              {qualityPercentage > 10 && (
                <span className="text-xs font-medium text-white px-1 leading-none">{qualityText}</span>
              )}
            </div>
            {qualityPercentage <= 10 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xs font-medium ${qualityPercentage > 5 ? 'text-white' : 'text-gray-600'} px-1 leading-none`}>{qualityText}</span>
              </div>
            )}
          </div>
        </div>

        {/* Anahtar Kelimeler */}
        {keywordList.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-2">
              {keywordList.map((kw, index) => (
                <Link
                  key={index}
                  href={`/kararlar?kw=${encodeURIComponent(kw)}`}
                  className="bg-sky-100 text-sky-700 px-2.5 py-0.5 rounded-full text-xs font-medium hover:bg-sky-200 hover:text-sky-800 transition-colors cursor-pointer"
                >
                  {kw}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI Özeti */}
        {aiSummary && (
          <div>
            <h3 className="flex items-center text-xs font-medium text-blue-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={aiSummaryIconPath} />
              </svg>
              AI Özeti
            </h3>
            <div className="leading-relaxed leading-loose space-y-2 max-h-40 overflow-y-auto pr-1">
              <FormattedSummary summary={aiSummary} />
            </div>
          </div>
        )}

        {/* Detay Butonu */}
        <div className="mt-auto pt-2">
          <Link href={`/kararlar/${id}`}
            className="block w-full text-center bg-orange-500 text-white font-medium py-2 rounded-lg hover:bg-orange-600 transition-colors duration-150 shadow hover:shadow-md"
          >
            Tam Karar Metnini Gör
          </Link>
        </div>
      </div>
    </div>
  );
}