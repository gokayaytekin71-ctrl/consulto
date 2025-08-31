// components/HighlightedKararBody.jsx

"use client";

import React from 'react';

// Metin içinde belirli ifadeleri ve aralıkları vurgulamak için yardımcı fonksiyon
const highlightText = (text, phrasesToHighlight, rangesToHighlight) => {
  // ... (Fonksiyonun üst kısmı aynı kalıyor)
  if (!text) return [];

  const lines = text.split(/(\r?\n)/); 
  
  const highlightedElements = lines.map((line, lineIndex) => {
    if (line.match(/^\s*$/)) { return null; }
    if (line.match(/\r?\n/)) { return <br key={`br-${lineIndex}`} />; }

    let currentText = line;
    let allHighlights = [];

    phrasesToHighlight.forEach(phraseObj => {
        const phrase = phraseObj.phrase;

        // --- DEĞİŞİKLİK BURADA: Regex oluşturma mantığını güncelliyoruz ---
        let phrasePattern;
        // Önce ifadedeki özel Regex karakterlerinden kaçındığımıza emin olalım.
        const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        if (phrase.startsWith('"') && phrase.endsWith('"')) {
            // Eğer ifade tırnak içindeyse, kelime sınırı (\b) kullanma.
            // Bu, '"I. DAVA"' gibi ifadelerin doğru bulunmasını sağlar.
            phrasePattern = new RegExp(escapedPhrase, 'gi');
        } else if (phrase === 'Sonuç:') {
            // "Sonuç:" için özel durumunu koruyalım, çünkü ardındaki boşluğu da yakalamak istiyoruz.
            phrasePattern = /\bSonuç:\s*/gi;
        } else if (phrase.includes(' ')) {
            // Çok kelimeli ifadeler için, tam dizgiyi eşle
            phrasePattern = new RegExp(escapedPhrase, 'gi');
        } else {
            // Normal kelimeler için kelime sınırı kullanmaya devam et.
            // Bu, "on" kelimesinin "onanmıştır" içinde bulunmasını engeller.
            phrasePattern = new RegExp(`\\b${escapedPhrase}\\b\\W*`, 'gi');
        }
        // --- DEĞİŞİKLİĞİN SONU ---
        
        let match;
        while ((match = phrasePattern.exec(currentText)) !== null) {
            let highlightLength = phrase.length;
            if (phrase.startsWith('"') || phrase === 'Sonuç:') {
                highlightLength = match[0].length;
            }

            allHighlights.push({ 
                index: match.index, 
                length: highlightLength, 
                style: phraseObj.style,
                priority: 2 
            });
        }
    });

    // ... (Fonksiyonun geri kalanı tamamen aynı)
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
              allHighlights.push({ index: highlightStart, length: highlightEnd - highlightStart, style: range.style, priority: 1 });
            }
            searchStartIndex = highlightEnd; 
            startPhraseRegex.lastIndex = searchStartIndex; 
        } else {
            searchStartIndex = startIndex + startLength; 
            startPhraseRegex.lastIndex = searchStartIndex;
        }
      }
    });

    allHighlights.sort((a, b) => {
        if (a.index === b.index) { return b.priority - a.priority; }
        return a.index - b.index;
    });

    const parts = [];
    let processedCharIndex = 0; 
    for (const highlight of allHighlights) {
        if (highlight.index < processedCharIndex) {
            if (highlight.index + highlight.length <= processedCharIndex) { continue; }
            highlight.index = processedCharIndex;
            highlight.length = highlight.index + highlight.length - processedCharIndex;
            if (highlight.length <= 0) continue; 
        }
        if (highlight.index > processedCharIndex) { parts.push(currentText.substring(processedCharIndex, highlight.index)); }
        const highlightedSegment = currentText.substring(highlight.index, highlight.index + highlight.length);
        if (highlightedSegment.length > 0) { 
            parts.push(<span key={`highlight-${lineIndex}-${highlight.index}-${highlightedSegment.length}`} className={highlight.style}>{highlightedSegment}</span>);
        }
        processedCharIndex = Math.max(processedCharIndex, highlight.index + highlight.length);
    }
    if (processedCharIndex < currentText.length) { parts.push(currentText.substring(processedCharIndex)); }

    // NOT: Bu satırı bir önceki adımda değiştirmiştik ve doğru hali bu.
    // Metin rengini üst bileşenden alıyor.
    return (
      <p key={lineIndex} className="mb-4">
        {parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>)}
      </p>
    );
  });

  return <>{highlightedElements.filter(Boolean)}</>;
};

// Bu export default fonksiyonu ve içindeki arrayler aynı kalıyor.
export default function HighlightedKararBody({ fullContent }) {
  // NOT: phrasesToHighlight array'ine dokunmanıza gerek yok,
  // yaptığımız düzeltme sayesinde artık doğru çalışacak.
  const phrasesToHighlight = [
    { phrase: '"İçtihat Metni"', style: "text-sky-400 font-bold" }, 
    { phrase: "I. DAVA", style: "text-sky-400 font-bold" },
    { phrase: "II. CEVAP", style: "text-sky-400 font-bold" },
    { phrase: "III. MAHKEME KARARI", style: "text-sky-400 font-bold" },
    { phrase: "III. İLK DERECE MAHKEMESİ KARARI", style: "text-sky-400 font-bold" },
    { phrase: "IV. BOZMA VE BOZMADAN SONRAKİ YARGILAMA SÜRECİ", style: "text-sky-400 font-bold" },
    { phrase: "III. İLK DERECE MAHKEMESİ KARARI", style: "text-sky-400 font-bold" },
    { phrase: "IV. İSTİNAF", style: "text-sky-400 font-bold" },
    { phrase: "VI. TEMYİZ", style: "text-sky-400 font-bold" },
    { phrase: "V. TEMYİZ", style: "text-sky-400 font-bold" },
    { phrase: "IV. TEMYİZ", style: "text-sky-400 font-bold" },
    { phrase: "VII. KARAR", style: "text-sky-400 font-bold" },
    { phrase: "VII. KARAR", style: "text-sky-400 font-bold" },
    { phrase: "V. BOZMA VE BOZMADAN SONRAKİ YARGILAMA SÜRECİ", style: "text-sky-400 font-bold" },
    { phrase: "B. Değerlendirme ve Gerekçe", style: "text-sky-400 font-bold" },
    { phrase: "A. Temyiz Sebepleri", style: "text-sky-400 font-bold" },
    { phrase: "hükmü yer almaktadır", style: "text-sky-400" },
    { phrase: "direnmiştir", style: "text-sky-400" },
    { phrase: "ONANMASINA", style: "text-sky-400 font-bold" },
    { phrase: "Sonuç:", style: "text-sky-400 font-bold" }, 
    { phrase: "toplanmaktadır", style: "text-sky-400" },
    { phrase: "Temyiz Eden", style: "text-sky-400 font-bold" },
    { phrase: "direnilmiştir.", style: "text-sky-400" },
    { phrase: "gerekçesiyle", style: "text-sky-400" },
    { phrase: "gereği görüşüldü", style: "text-sky-400 font-bold" },
    { phrase: "gereği düşünüldü", style: "text-sky-400 font-bold" },
    { phrase: "HUKUK GENEL KURULU KARARI", style: "text-sky-400 font-bold" } 
  ];
  const rangesToHighlight = [
    { start: "dava", end: "ilişkindir", style: "text-sky-400" }, 
    { start: "uyuşmazlık", end: "toplanmaktadır", style: "text-sky-400" }, 
    { start: "taraflar arasındaki", end: "yargılama sonunda", style: "text-sky-400" },
    { start: "Açıklanan nedenlerle", end: "onanmalıdır", style: "text-sky-400" },
    { start: "Açıklanan nedenlerle", end: "bozulmuştur", style: "text-sky-400 " },
    { start: "Açıklanan nedenlerle", end: "onanmıştır", style: "text-sky-400" },
    { start: "Açıklanan nedenlerle", end: "bozulmalıdır", style: "text-sky-400" },
  ];
  // ... (Fonksiyonun geri kalanı aynı)
  let contentToDisplay = fullContent || "";
  const ijtihadMetniMarker = '"İçtihat Metni"'; 
  const startIndex = contentToDisplay.indexOf(ijtihadMetniMarker);
  if (startIndex !== -1) { contentToDisplay = contentToDisplay.substring(startIndex); } 
  else {
    const lines = contentToDisplay.split(/\r?\n/);
    if (lines.length > 1 && lines[0].trim().length < 100) { contentToDisplay = lines.slice(1).join('\n');}
  }
  contentToDisplay = contentToDisplay.trim(); 
  if (!contentToDisplay) { return ( <div className="text-center text-gray-500 py-10"> Karar metni işlendikten sonra boş kaldı veya bulunamadı. </div> ); }
  return ( <div className="text-base leading-relaxed text-justify space-y-0"> {highlightText(contentToDisplay, phrasesToHighlight, rangesToHighlight)} </div> );
}