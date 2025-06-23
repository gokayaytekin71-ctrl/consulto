"use client";

import { useEffect, useState } from "react";
import LoadingOverlay from "@/components/LoadingOverlay";
import FavoriteButton from "@/components/FavoriteButton";

export default function FavoriMakalelerPage() {
  const [makaleler, setMakaleler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bildirim, setBildirim] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const favRes = await fetch("/api/favorites/makale");
        const favData = await favRes.json();
        const makaleArray = favData.map((f) => f.makale);
        setMakaleler(makaleArray);
      } catch (error) {
        console.error("Veriler alınamadı:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001933] to-[#004066] p-6">
      <h1 className="text-3xl font-bold text-white mb-6 border-l-4 border-orange-500 pl-4">
        Favori Makalelerim
      </h1>
      {bildirim && <div className="text-green-400 text-sm mb-4">{bildirim}</div>}
      {loading ? (
        <LoadingOverlay />
      ) : makaleler.length === 0 ? (
        <p className="text-white opacity-70">Henüz favori makaleniz yok.</p>
      ) : (
        <ul className="space-y-4">
          {makaleler.map((makale) => {
            const title = makale.baslik.trim();
            const doi = makale.doi;
            return (
              <li
                key={makale.id}
                className="flex justify-between items-center rounded-lg p-4 bg-gray-800/50 hover:bg-gray-700/70 transition-all duration-300 shadow-md"
              >
                <a
                  href={`https://doi.org/${doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-white hover:text-yellow-300 capitalize"
                >
                  {title}
                </a>
                <FavoriteButton
                  itemId={doi}
                  itemType="makale"
                  initialIsFavorited={true}
                  onSuccess={(data) => {
                    if (data.removed) {
                      setMakaleler((prev) =>
                        prev.filter((m) => m.doi !== doi)
                      );
                      setBildirim("Makale favorilerden kaldırıldı");
                      setTimeout(() => setBildirim(""), 3000);
                    }
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}