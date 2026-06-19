// components/FormattedSummary.jsx
import React from 'react';

const KEYWORD_STYLES = {
  "Konu:": "text-blue-700 font-bold",
  "1) Konu:": "text-blue-700 font-bold",
  "Uyuşmazlık:": "text-blue-700 font-bold",
  "HGK Gerekçesi ve Sonuç:": "text-indigo-700 font-bold",
  "2) HGK Gerekçesi ve Sonuç:": "text-indigo-700 font-bold",
  "HGK Gerekçesi:": "text-indigo-700 font-bold",
  "Gerekçe ve Sonuç:": "text-indigo-700 font-bold",
  "Sonuç:": "text-emerald-700 font-bold",
};

const SORTED_KEYWORDS = Object.keys(KEYWORD_STYLES).sort((a, b) => b.length - a.length);

export default function FormattedSummary({ summary, defaultLineClass = "text-gray-600" }) {
  if (!summary) return null;

  const lines = summary.split('\n').filter(line => line.trim() !== '');

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        // 1. Önce baştaki ve sondaki boşlukları alıyoruz
        const trimmedLine = line.trim();
        
        // 2. Markdown yıldızlarını (**) satırdan tamamen temizliyoruz
        // Böylece "**Gerekçe ve Sonuç:**" metni "Gerekçe ve Sonuç:" haline geliyor.
        const cleanLine = trimmedLine.replace(/\*\*/g, '');
        
        let keywordFound = false;

        for (const keyword of SORTED_KEYWORDS) {
          // 3. Eşleşmeyi temizlenmiş satır (cleanLine) üzerinden yapıyoruz
          if (cleanLine.startsWith(keyword)) {
            const restOfLine = cleanLine.substring(keyword.length).trim();
            keywordFound = true;
            return (
              <p key={index} className="text-sm">
                <span className={KEYWORD_STYLES[keyword]}>{keyword}</span>
                <span className={defaultLineClass}> {restOfLine}</span>
              </p>
            );
          }
        }

        if (!keywordFound) {
          return (
            <p key={index} className={`text-sm ${defaultLineClass}`}>
              {/* Normal satırları da temizlenmiş haliyle basıyoruz ki yıldız kalmasın */}
              {cleanLine} 
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}