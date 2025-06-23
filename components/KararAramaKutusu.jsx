"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import LoadingOverlay from "./LoadingOverlay";

export default function KararAramaKutusu({ mevcutAramaSorgusu }) {
  const [aramaMetni, setAramaMetni] = useState(mevcutAramaSorgusu || '');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('page', '1'); // Yeni arama her zaman 1. sayfadan başlar
    if (aramaMetni.trim()) {
      params.set('q', aramaMetni.trim());
    }
    startTransition(() => {
      router.push(`/kararlar?${params.toString()}`);
    });
  };

  return (
    <>
      {isPending && <LoadingOverlay />}
      <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto mb-12 flex space-x-4 items-center animate-fade-in-up delay-400">
        <div className="flex items-center flex-1 rounded-full p-[2px] bg-gradient-to-r from-blue-700/50 via-blue-400/50 to-blue-700/50 shadow-lg transition">
          <div className="flex items-center w-full bg-blue-900/70 rounded-full px-4 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={aramaMetni}
              onChange={e => setAramaMetni(e.target.value)}
              placeholder="Karar metninde ara..."
              className="w-full bg-transparent text-blue-100 placeholder-blue-300 focus:outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-full shadow-lg hover:bg-orange-600 transition-colors duration-300 transform hover:scale-105"
        >
          Ara
        </button>
      </form>
    </>
  );
}