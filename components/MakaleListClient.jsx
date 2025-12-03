"use client";

import { useState } from "react";
import FavoriteButton from "./FavoriteButton";

// --- İKONLAR ---
function IconBook({ className = "w-4 h-4" }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}

function IconExternal({ className = "w-4 h-4" }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
}

function IconCalendar({ className = "w-4 h-4" }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}

export default function MakaleListClient({ initialMakaleler, initialFavDois }) {
  // Set kullanarak O(1) erişim hızı sağlıyoruz
  const [favDois, setFavDois] = useState(new Set(initialFavDois));

  const toggleFav = (doi, isFav) => {
    setFavDois((prev) => {
      const nxt = new Set(prev);
      isFav ? nxt.add(doi) : nxt.delete(doi);
      return nxt;
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {initialMakaleler.map((m) => {
        const year = m.createdAt ? new Date(m.createdAt).getFullYear() : "2024";
        
        return (
          <article
            key={m.doi}
            className="group relative flex flex-col bg-slate-800/40 hover:bg-slate-800 rounded-2xl border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 p-6 shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1"
          >
            {/* Header: Badge & Favorite */}
            <div className="flex items-start justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:border-indigo-500/30 group-hover:text-indigo-300 transition-colors">
                <IconBook className="w-3 h-3" />
                Akademik
              </span>
              
              {/* Favorite Button: Sağ üstte bağımsız duruyor */}
              <div className="relative z-20">
                <FavoriteButton
                  itemId={m.doi}
                  itemType="makale"
                  initialIsFavorited={favDois.has(m.doi)}
                  onSuccess={({ isFavorited }) => toggleFav(m.doi, isFavorited)}
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-700 hover:text-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  iconSize="h-5 w-5"
                />
              </div>
            </div>

            {/* Title (Link) */}
            <h3 className="text-lg font-bold text-slate-100 leading-snug mb-3 line-clamp-3 group-hover:text-white transition-colors">
              <a
                href={`https://doi.org/${m.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="focus:outline-none group/link"
              >
                {/* Tüm kartı tıklanabilir yapmak için trick */}
                <span className="absolute inset-0 z-10" aria-hidden="true" />
                {m.baslik}
                <IconExternal className="inline-block ml-2 w-4 h-4 text-slate-500 group-hover/link:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100 -translate-y-0.5" />
              </a>
            </h3>

            {/* Footer: Date & Decor */}
            <div className="mt-auto pt-4 border-t border-slate-700/50 flex items-center justify-between text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <IconCalendar className="w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
                <span className="font-mono text-xs">{year}</span>
              </div>
              
              {/* Hover Arrow */}
              <div className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-indigo-400 font-medium text-xs flex items-center gap-1">
                Oku <span className="text-lg leading-none">→</span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}