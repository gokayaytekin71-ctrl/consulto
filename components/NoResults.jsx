// components/NoResults.jsx
"use client";

export default function NoResults() {
  return (
    // DEĞİŞİKLİK: Bileşen, referans alınan koyu tema kart stiline uyarlandı.
    // Arka plan, kenarlık, dolgu ve gölge değerleri güncellendi.
    <div className="bg-slate-900/40 border border-slate-700/60 p-8 rounded-xl shadow-lg text-center mt-8">
      
      {/* DEĞİŞİKLİK: Başlık metninin rengi güncellendi (text-gray-800 -> text-slate-100). */}
      <h2 className="text-2xl font-bold text-slate-100 mb-4">
        Sonuç Bulunamadı 🤷‍♂️
      </h2>
      
      {/* DEĞİŞİKLİK: Açıklama metninin rengi güncellendi (text-gray-600 -> text-slate-400). */}
      <p className="text-slate-400">
        Aradığınız kritere uygun bir karar bulunamadı. Lütfen farklı anahtar kelimelerle tekrar deneyin.
      </p>
    </div>
  );
}