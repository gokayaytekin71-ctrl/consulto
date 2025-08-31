"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function SayfalamaKontrol({ cursor, total }) {
  const router = useRouter();

  const loadMore = () => {
    const search = new URLSearchParams(window.location.search);
    search.set('cursor', cursor);
    router.push(`${window.location.pathname}?${search.toString()}`);
  };

  if (!cursor) return null;
  return (
    <div className="text-center my-6">
      <button
        onClick={loadMore}
        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-500"
      >
        Daha Fazla Yükle
      </button>
      <p className="text-sm text-gray-600 mt-2">Toplam Karar: {total}</p>
    </div>
  );
}