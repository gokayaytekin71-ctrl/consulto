"use client";

import { useRouter, useSearchParams } from 'next/navigation';

export default function SayfalamaKontrol({ toplamSayfa, mevcutSayfa }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (sayfa) => {
    if (sayfa < 1 || sayfa > toplamSayfa) return;
    const params = new URLSearchParams(searchParams);
    params.set('page', sayfa.toString());
    router.push(`/kararlar?${params.toString()}`);
  };
  
  const getPageNumbers = () => {
    const pageNumbers = [];
    if (toplamSayfa <= 7) {
      for (let i = 1; i <= toplamSayfa; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      if (mevcutSayfa > 3) pageNumbers.push('...');
      let start = Math.max(2, mevcutSayfa - 1);
      let end = Math.min(toplamSayfa - 1, mevcutSayfa + 1);
      if (mevcutSayfa <= 2) end = 3;
      if (mevcutSayfa >= toplamSayfa - 1) start = toplamSayfa - 2;
      for (let i = start; i <= end; i++) pageNumbers.push(i);
      if (mevcutSayfa < toplamSayfa - 2) pageNumbers.push('...');
      pageNumbers.push(toplamSayfa);
    }
    return [...new Set(pageNumbers)];
  };
  
  if (toplamSayfa <= 1) return null;

  return (
    <div className="mt-12 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
      <span className="text-sm text-gray-400">
        Sayfa {mevcutSayfa} / {toplamSayfa}
      </span>
      <div className="flex items-center space-x-1 sm:space-x-2">
        <button onClick={() => handlePageChange(mevcutSayfa - 1)} disabled={mevcutSayfa === 1} className="px-3 py-2 sm:px-4 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm">Önceki</button>
        {getPageNumbers().map((page, index) =>
          typeof page === 'number' ? (
            <button key={page} onClick={() => handlePageChange(page)} className={`px-3 py-2 sm:px-4 border rounded-md text-sm ${mevcutSayfa === page ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}>{page}</button>
          ) : (<span key={`ellipsis-${index}`} className="px-1 sm:px-2 py-2 text-gray-400">...</span>)
        )}
        <button onClick={() => handlePageChange(mevcutSayfa + 1)} disabled={mevcutSayfa === toplamSayfa} className="px-3 py-2 sm:px-4 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm">Sonraki</button>
      </div>
    </div>
  );
}