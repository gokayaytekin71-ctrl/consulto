'use client';

import React, { useState } from 'react';

export default function DownloadPDFButton({ karar }) {
  const [loading, setLoading] = useState(false);

  // Butona tıklanınca çalışacak fonksiyon
  const handleDownload = async () => {
    if (!karar) return;
    
    setLoading(true);

    try {
      const response = await fetch("/api/kararlar/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(karar),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "PDF servisi yanıt vermedi.");
      }

      const blob = await response.blob();
      
      // 2. Tarayıcıda geçici bir indirme linki oluştur
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 3. Dosya adını belirle
      const safeCode = karar.code ? karar.code.replace(/[^a-zA-Z0-9]/g, '-') : 'Karar';
      link.download = `ConsultoHukuk-${safeCode}.pdf`;
      
      // 4. Tıkla ve indir
      document.body.appendChild(link);
      link.click();
      
      // 5. Temizlik yap
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("PDF Oluşturma Hatası:", error);
      const detail = error?.message ? `\n\nTeknik hata: ${error.message}` : "";
      alert(`PDF oluşturulurken bir hata meydana geldi.${detail}`);
    } finally {
      setLoading(false); // İşlem bitince yükleniyor'u kapat
    }
  };

  return (
    <div className="w-full">
      <button 
        onClick={handleDownload}
        disabled={loading}
        className="w-full py-2 bg-[var(--border-color)] hover:bg-[#334155] text-xs font-bold rounded text-white transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>HAZIRLANIYOR...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            PDF İNDİR
          </>
        )}
      </button>
    </div>
  );
}
