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
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold text-white mb-6 border-l-4 border-orange-500 pl-4">
        Favori Makaleleriniz
      </h1>
      {bildirim && <div className="text-green-400 text-sm mb-4">{bildirim}</div>}
      {loading ? (
        <LoadingOverlay />
      ) : makaleler.length === 0 ? (
        <p className="text-white opacity-70">Henüz favorilere makale eklemediniz.</p>
      ) : (
        <ul className="divide-y divide-cyan-500">
          {makaleler.map((makale) => {
            const title = makale.baslik.trim();
            const doi = makale.doi;
            return (
              <li
                key={makale.id}
                className="flex justify-between items-center p-4 bg-[#1f2a3a] text-white rounded-none border-b border-cyan-500"
              >
                <a
                  href={`https://doi.org/${doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-white capitalize"
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