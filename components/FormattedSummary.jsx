// components/FormattedSummary.jsx
"use client";

import React from 'react';

// Renklendirilecek anahtar kelimeleri ve atanacak CSS sınıflarını tanımlıyoruz.
// Bu obje artık tüm özet renklendirmeleri için tek kaynak olacak.
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

// En uzun anahtar kelimeden en kısaya doğru sıralayarak daha doğru eşleşme sağlıyoruz.
// Örneğin "HGK Gerekçesi ve Sonuç:"'un, "HGK Gerekçesi:"'nden önce kontrol edilmesi gerekir.
const SORTED_KEYWORDS = Object.keys(KEYWORD_STYLES).sort((a, b) => b.length - a.length);

export default function FormattedSummary({ summary, defaultLineClass = "text-gray-600" }) {
  if (!summary) return null;

  // Özet metnini satırlara ayırıp boş satırları filtreliyoruz.
  const lines = summary.split('\n').filter(line => line.trim() !== '');

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        let keywordFound = false;

        // Sıralanmış anahtar kelimeler listesinde dönerek satırın bir anahtar kelimeyle başlayıp başlamadığını kontrol et
        for (const keyword of SORTED_KEYWORDS) {
          if (trimmedLine.startsWith(keyword)) {
            const restOfLine = trimmedLine.substring(keyword.length).trim();
            keywordFound = true;
            return (
              <p key={index} className="text-sm">
                <span className={KEYWORD_STYLES[keyword]}>{keyword}</span>
                {/* Kalan metin için bir boşluk ekliyoruz */}
                <span className={defaultLineClass}> {restOfLine}</span>
              </p>
            );
          }
        }

        // Eğer satır bir anahtar kelime ile başlamıyorsa, normal şekilde yazdır
        if (!keywordFound) {
          return (
            <p key={index} className={`text-sm ${defaultLineClass}`}>
              {line}
            </p>
          );
        }

        return null; // Bu satıra asla ulaşılmamalı ama React için iyi bir pratiktir.
      })}
    </div>
  );
}