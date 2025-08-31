"use client";

import { useSession } from "next-auth/react";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useState, useEffect } from "react";
import DecisionCard from "@/components/DecisionCard";

export default function FavoriteKararlarClient() {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/favorites/karar")
        .then(res => res.ok ? res.json() : Promise.reject(res.status))
        .then(data => setFavorites(data))
        .catch(err => console.error("Favori kararlar yüklenirken hata:", err))
        .finally(() => setLoading(false));
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);

  if (loading) return <LoadingOverlay />;
  if (status !== "authenticated")
    return <div className="p-8 text-center text-red-600 font-semibold">Bu sayfayı görüntülemek için lütfen giriş yapın.</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-semibold text-white mb-6 border-l-4 border-orange-500 pl-3">
        Favori Kararlarınız
      </h1>
      {favorites.length === 0 ? (
        <div className="p-8 text-center italic text-gray-500">Henüz favori kararınız yok.</div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map(fav => fav.karar && (
            <DecisionCard
              key={fav.kararId}
              id={fav.karar.fileName.replace(/\.txt$/, "")}
              type={fav.karar.type}
              code={fav.karar.code}
              aiSummary={fav.karar.aiSummary}
              keywords={fav.karar.keywords}
              contentLength={fav.karar.contentLength}
            />
          ))}
        </div>
      )}
    </div>
  );
}