"use client";

import { useState } from "react";
import FavoriteButton from "./FavoriteButton";

export default function MakaleListClient({ initialMakaleler, initialFavDois }) {
  const [favDois, setFavDois] = useState(new Set(initialFavDois));

  const toggleFav = (doi, isFav) => {
    setFavDois(prev => {
      const nxt = new Set(prev);
      isFav ? nxt.add(doi) : nxt.delete(doi);
      return nxt;
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {initialMakaleler.map(m => (
        <div
          key={m.doi}
          className="
            p-6
            bg-white/10
            backdrop-blur-sm
            rounded-2xl
            shadow-lg hover:shadow-xl
            transition-shadow duration-300
          "
        >
          <div className="flex items-start justify-between mb-4">
            <a
              href={`https://doi.org/${m.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <h3 className="text-lg font-semibold text-white break-words">
                {m.baslik}
              </h3>
            </a>
            <FavoriteButton
              itemId={m.doi}
              itemType="makale"
              initialIsFavorited={favDois.has(m.doi)}
              onSuccess={({ isFavorited }) => toggleFav(m.doi, isFavorited)}
              className="p-1 rounded-md text-yellow-400 hover:bg-yellow-400/20 focus:ring-yellow-400"
              iconSize="h-6 w-6"
            />
          </div>
        </div>
      ))}
    </div>
  );
}