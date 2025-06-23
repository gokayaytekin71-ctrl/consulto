// components/HighlightedKararBody.jsx

"use client";

import React from 'react';

// Metin içinde belirli ifadeleri ve aralıkları vurgulamak için yardımcı fonksiyon
const highlightText = (text, phrasesToHighlight, rangesToHighlight) => {
  if (!text) return [];

  const lines = text.split(/(\r?\n)/); 
  
  const highlightedElements = lines.map((line, lineIndex) => {
    if (line.match(/^\s*$/)) { 
      return null; 
    }
    
    if (line.match(/\r?\n/)) {
      return <br key={`br-${lineIndex}`} />;
    }

    let currentText = line;
    let allHighlights = [];

    // 1. Sabit ifadelerin vurgulamalarını bul (phrasesToHighlight)
    phrasesToHighlight.forEach(phraseObj => {
        // İyileştirilmiş regex: Kelimeyi ve ardındaki isteğe bağlı noktalama işaretlerini yakala.
        // "İçtihat Metni" özel durumu için de esnekleştirildi.
        let phrasePattern;
        if (phraseObj.phrase === '"İçtihat Metni"') {
            // Tırnak işaretli ifadenin tamamını yakala
            phrasePattern = /"İçtihat Metni"/gi;
        } else if (phraseObj.phrase === 'Sonuç:') {
            // "Sonuç:" kelimesini ve iki nokta üst üste işaretini yakala
            phrasePattern = /\bSonuç:\s*/gi; // Sonuç: ve ardından gelen boşlukları da yakala
        }
        else {
            // Diğer kelimeler için: kelime sınırları ve ardından gelen isteğe bağlı noktalama
            phrasePattern = new RegExp(`\\b${phraseObj.phrase}\\b\\W*`, 'gi'); 
        }
        
        let match;
        while ((match = phrasePattern.exec(currentText)) !== null) {
            // Vurgulanan kısım, eşleşen ifadenin orijinal uzunluğu olmalı.
            // Örneğin "gerekçesiyle," için match[0] "gerekçesiyle," olabilir.
            // Biz sadece "gerekçesiyle" kısmını vurgulamak istiyorsak:
            let highlightLength = phraseObj.phrase.length;
            if (phraseObj.phrase === '"İçtihat Metni"' || phraseObj.phrase === 'Sonuç:') {
                highlightLength = match[0].length; // Tam eşleşmeyi vurgula
            }

            allHighlights.push({ 
                index: match.index, 
                length: highlightLength, 
                style: phraseObj.style,
                priority: 2 
            });
        }
    });

    // 2. Aralık vurgulamalarını bul (rangesToHighlight)
    rangesToHighlight.forEach(range => {
      const startPhraseRegex = new RegExp(`\\b${range.start}\\b`, 'gi');
      const endPhraseRegex = new RegExp(`\\b${range.end}\\b`, 'gi');
      
      let startMatch;
      let searchStartIndex = 0;

      while ((startMatch = startPhraseRegex.exec(currentText)) !== null) {
        const startIndex = startMatch.index;
        const startLength = startMatch[0].length;

        let endMatch;
        endPhraseRegex.lastIndex = startIndex + startLength; 
        if ((endMatch = endPhraseRegex.exec(currentText)) !== null) {
            const endIndex = endMatch.index;
            const endLength = endMatch[0].length;

            const highlightStart = startIndex;
            const highlightEnd = endIndex + endLength;

            if (highlightStart < highlightEnd) { 
              allHighlights.push({
                index: highlightStart,
                length: highlightEnd - highlightStart,
                style: range.style,
                priority: 1 
              });
            }
            searchStartIndex = highlightEnd; 
            startPhraseRegex.lastIndex = searchStartIndex; 
        } else {
            searchStartIndex = startIndex + startLength; 
            startPhraseRegex.lastIndex = searchStartIndex;
        }
      }
    });

    // 3. Numaralı ifadelerin vurgulamalarını bul ("1-", "2-", "1.", "2.", ...) - KALDIRILDI
    // Bu bölüm tamamen kaldırıldı.
    // const numberedPhraseRegex = /^\s*(\d+[-.]\s*)/g; 
    // let match;
    // while ((match = numberedPhraseRegex.exec(currentText)) !== null) { 
    //     allHighlights.push({
    //         index: match.index,
    //         length: match[0].length,
    //         style: "text-blue-900 font-bold", 
    //         priority: 3 
    //     });
    // }

    // Tüm vurgulamaları başlangıç indeksine göre sırala
    allHighlights.sort((a, b) => {
        if (a.index === b.index) {
            return b.priority - a.priority; 
        }
        return a.index - b.index;
    });

    const parts = [];
    let processedCharIndex = 0; 

    for (const highlight of allHighlights) {
        if (highlight.index < processedCharIndex) {
            if (highlight.index + highlight.length <= processedCharIndex) { 
                 continue; 
            }
            highlight.index = processedCharIndex;
            highlight.length = highlight.index + highlight.length - processedCharIndex;
            if (highlight.length <= 0) continue; 
        }
        
        if (highlight.index > processedCharIndex) {
            parts.push(currentText.substring(processedCharIndex, highlight.index));
        }

        const highlightedSegment = currentText.substring(highlight.index, highlight.index + highlight.length);
        if (highlightedSegment.length > 0) { 
            parts.push(<span key={`highlight-${lineIndex}-${highlight.index}-${highlightedSegment.length}`} className={highlight.style}>{highlightedSegment}</span>);
        }
        
        processedCharIndex = Math.max(processedCharIndex, highlight.index + highlight.length);
    }

    if (processedCharIndex < currentText.length) {
        parts.push(currentText.substring(processedCharIndex));
    }

    return (
      <p key={lineIndex} className="mb-2 text-gray-700">
        {parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>)}
      </p>
    );
  });

  return <>{highlightedElements.filter(Boolean)}</>;
};

export default function HighlightedKararBody({ fullContent }) {
  const phrasesToHighlight = [
    // "İçtihat Metni" için özel regex kullanılacak
    { phrase: '"İçtihat Metni"', style: "font-bold text-red-700" }, 
    { phrase: "hükmü yer almaktadır", style: "font-semibold text-gray-800" },
    { phrase: "direnmiştir", style: "font-semibold text-red-700" },
    // "Sonuç:" için özel regex kullanılacak
    { phrase: "Sonuç:", style: "font-bold text-blue-900" }, 
    { phrase: "toplanmaktadır", style: "font-semibold text-gray-800" },
    { phrase: "Temyiz Eden", style: "font-bold text-red-700" },
    { phrase: "direnilmiştir.", style: "font-bold text-red-700" },
    { phrase: "gerekçesiyle", style: "font-semibold text-gray-800" }, // Koyu Gri
    { phrase: "Yerel Mahkemece", style: "font-semibold text-blue-900" },
    { phrase: "gereği görüşüldü", style: "font-bold text-red-700" },
    { phrase: "gereği düşünüldü", style: "font-bold text-red-700" },
    { phrase: "HUKUK GENEL KURULU KARARI", style: "font-bold text-red-700" } 
  ];

  const rangesToHighlight = [
    { start: "dava", end: "ilişkindir", style: "text-blue-900 font-semibold" }, 
    { start: "uyuşmazlık", end: "toplanmaktadır", style: "text-red-700 font-semibold" }, 
    { start: "taraflar arasındaki", end: "yargılama sonunda", style: "text-blue-900 font-semibold" },
    { start: "Açıklanan nedenlerle", end: "onanmalıdır", style: "text-blue-900 font-semibold" },
    { start: "Açıklanan nedenlerle", end: "bozulmuştur", style: "text-blue-900 font-semibold" },
    { start: "Açıklanan nedenlerle", end: "onanmıştır", style: "text-blue-900 font-semibold" },
    { start: "Açıklanan nedenlerle", end: "bozulmalıdır", style: "text-blue-900 font-semibold" },
  ];


  let contentToDisplay = fullContent || "";
  const ijtihadMetniMarker = '"İçtihat Metni"'; 

  // --- "İçtihat Metni"nin kendisini dahil etme mantığı aynı kalacak ---
  const startIndex = contentToDisplay.indexOf(ijtihadMetniMarker);
  if (startIndex !== -1) {
    contentToDisplay = contentToDisplay.substring(startIndex); 
  } else {
    const lines = contentToDisplay.split(/\r?\n/);
    if (lines.length > 1 && lines[0].trim().length < 100) { 
        contentToDisplay = lines.slice(1).join('\n');
    }
  }
  
  contentToDisplay = contentToDisplay.trim(); 

  if (!contentToDisplay) {
    return (
      <div className="text-center text-gray-500 py-10">
        Karar metni işlendikten sonra boş kaldı veya bulunamadı.
      </div>
    );
  }

  return (
    <div className="text-base leading-relaxed text-justify space-y-0">
      {highlightText(contentToDisplay, phrasesToHighlight, rangesToHighlight)}
    </div>
  );
}