// components/HighlightedKararBody.jsx

"use client";

import React from 'react';

// --- TEMA RENK SINIFLARI (Editorial Law Review paletine uyarlandı) ---
// Yapısal başlıklar: lacivert + kalın · Karar/sonuç ifadeleri: altın
const C = {
  heading: "khl-heading",  // lacivert, kalın  (bölüm başlıkları)
  result:  "khl-result",   // altın, kalın     (ONANMASINA, Sonuç: vb.)
  accent:  "khl-accent",   // lacivert, normal  (gerekçe/aralık ifadeleri)
};

// Metin içinde belirli ifadeleri ve aralıkları vurgulamak için yardımcı fonksiyon
const highlightText = (text, phrasesToHighlight, rangesToHighlight) => {
  if (!text) return [];

  const lines = text.split(/(\r?\n)/);

  const highlightedElements = lines.map((line, lineIndex) => {
    if (line.match(/^\s*$/)) { return null; }
    if (line.match(/\r?\n/)) { return <br key={`br-${lineIndex}`} />; }

    let currentText = line;
    let allHighlights = [];

    phrasesToHighlight.forEach(phraseObj => {
        const phrase = phraseObj.phrase;

        let phrasePattern;
        const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        if (phrase.startsWith('"') && phrase.endsWith('"')) {
            phrasePattern = new RegExp(escapedPhrase, 'gi');
        } else if (phrase === 'Sonuç:') {
            phrasePattern = /\bSonuç:\s*/gi;
        } else if (phrase.includes(' ')) {
            phrasePattern = new RegExp(escapedPhrase, 'gi');
        } else {
            phrasePattern = new RegExp(`\\b${escapedPhrase}\\b\\W*`, 'gi');
        }

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

    // Paragraf class'ı kaldırıldı: stil artık page.jsx içindeki
    // .highlighted-body p (serif okuma tipografisi) tarafından yönetiliyor.
    return (
      <p key={lineIndex}>
        {parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>)}
      </p>
    );
  });

  return <>{highlightedElements.filter(Boolean)}</>;
};

export default function HighlightedKararBody({ fullContent }) {
  const phrasesToHighlight = [
    { phrase: '"İçtihat Metni"', style: C.heading },
    { phrase: "I. DAVA", style: C.heading },
    { phrase: "II. CEVAP", style: C.heading },
    { phrase: "III. MAHKEME KARARI", style: C.heading },
    { phrase: "III. İLK DERECE MAHKEMESİ KARARI", style: C.heading },
    { phrase: "IV. BOZMA VE BOZMADAN SONRAKİ YARGILAMA SÜRECİ", style: C.heading },
    { phrase: "III. İLK DERECE MAHKEMESİ KARARI", style: C.heading },
    { phrase: "IV. İSTİNAF", style: C.heading },
    { phrase: "VI. TEMYİZ", style: C.heading },
    { phrase: "V. TEMYİZ", style: C.heading },
    { phrase: "IV. TEMYİZ", style: C.heading },
    { phrase: "VII. KARAR", style: C.heading },
    { phrase: "VII. KARAR", style: C.heading },
    { phrase: "V. BOZMA VE BOZMADAN SONRAKİ YARGILAMA SÜRECİ", style: C.heading },
    { phrase: "B. Değerlendirme ve Gerekçe", style: C.heading },
    { phrase: "A. Temyiz Sebepleri", style: C.heading },
    { phrase: "hükmü yer almaktadır", style: C.accent },
    { phrase: "direnmiştir", style: C.accent },
    { phrase: "ONANMASINA", style: C.result },
    { phrase: "Sonuç:", style: C.result },
    { phrase: "toplanmaktadır", style: C.accent },
    { phrase: "Temyiz Eden", style: C.heading },
    { phrase: "direnilmiştir.", style: C.accent },
    { phrase: "gerekçesiyle", style: C.accent },
    { phrase: "gereği görüşüldü", style: C.result },
    { phrase: "gereği düşünüldü", style: C.result },
    { phrase: "HUKUK GENEL KURULU KARARI", style: C.heading }
  ];
  const rangesToHighlight = [
    { start: "dava", end: "ilişkindir", style: C.accent },
    { start: "uyuşmazlık", end: "toplanmaktadır", style: C.accent },
    { start: "taraflar arasındaki", end: "yargılama sonunda", style: C.accent },
    { start: "Açıklanan nedenlerle", end: "onanmalıdır", style: C.result },
    { start: "Açıklanan nedenlerle", end: "bozulmuştur", style: C.result },
    { start: "Açıklanan nedenlerle", end: "onanmıştır", style: C.result },
    { start: "Açıklanan nedenlerle", end: "bozulmalıdır", style: C.result },
  ];

  let contentToDisplay = fullContent || "";
  const ijtihadMetniMarker = '"İçtihat Metni"';
  const startIndex = contentToDisplay.indexOf(ijtihadMetniMarker);
  if (startIndex !== -1) { contentToDisplay = contentToDisplay.substring(startIndex); }
  else {
    const lines = contentToDisplay.split(/\r?\n/);
    if (lines.length > 1 && lines[0].trim().length < 100) { contentToDisplay = lines.slice(1).join('\n');}
  }
  contentToDisplay = contentToDisplay.trim();
  if (!contentToDisplay) {
    return (
      <div style={{ textAlign: "center", color: "var(--ink-faint)", padding: "40px 0" }}>
        Karar metni işlendikten sonra boş kaldı veya bulunamadı.
      </div>
    );
  }
  return (
    <div className="khl-root">
      {highlightText(contentToDisplay, phrasesToHighlight, rangesToHighlight)}

      {/* Vurgu renkleri — tema değişkenleriyle (page.jsx :root) uyumlu */}
      <style dangerouslySetInnerHTML={{ __html: `
        .khl-heading {
          color: var(--navy, #0f2a4a);
          font-weight: 700;
          font-family: 'Fraunces', Georgia, serif;
        }
        .khl-result {
          color: var(--amber, #b8860b);
          font-weight: 600;
        }
        .khl-accent {
          color: var(--navy-2, #163a63);
          font-weight: 500;
        }
      `}} />
    </div>
  );
}