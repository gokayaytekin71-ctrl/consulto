"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function FavoriteMevzuatPage() {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      // API'yi çağır ve zenginleştirilmiş veriyi al
      fetch("/api/favorites/mevzuat")
        .then(res => {
          if (!res.ok) throw new Error('Sunucu yanıt vermiyor');
          return res.json();
        })
        .then(data => {
          setFavorites(data);
        })
        .catch(err => console.error("Favori mevzuat yüklenirken hata:", err))
        .finally(() => setLoading(false));
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);

  if (loading) {
    return <LoadingOverlay />;
  }
  if (status !== "authenticated") { /* ... */ }
  if (favorites.length === 0) { /* ... */ }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-semibold text-white mb-6 border-l-4 border-orange-500 pl-3">
        Favori Mevzuat Maddeleri
      </h1>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {favorites.map(fav => (
          <div key={fav.id} className="bg-white rounded-lg shadow hover:shadow-md transition p-4 border border-gray-100">
            {/* Artık 'name' doğrudan 'fav' objesinden geliyor! */}
            <h2 className="text-lg font-semibold text-blue-700 truncate">
              {fav.name}
            </h2>
            {fav.maddeNo && (
              <p className="text-sm text-gray-600 mt-1">
                İlgili Madde: <span className="font-medium text-gray-800">Madde {fav.maddeNo}</span>
              </p>
            )}
            <Link
              href={`/mevzuat/${encodeURIComponent(fav.mevzuatKey)}`}
              className="inline-block mt-4 text-sm text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded transition"
            >
              Detayı Gör
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}