"use client";

import { useState, useEffect } from "react";

function generateRecentDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
}

export default function ResmiGazeteListesi() {
  const [dates, setDates] = useState([]);
  const [visibleCount, setVisibleCount] = useState(7);

  useEffect(() => {
    setDates(generateRecentDates());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001933] to-[#004066] p-6 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] via-[#FF9500] to-[#FFC300] text-center drop-shadow-lg mb-10">
        Resmi Gazeteler (PDF)
      </h1>
      <ul className="grid gap-6 w-full max-w-xl mx-auto">
        {dates.slice(0, visibleCount).map((date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const url = `https://www.resmigazete.gov.tr/eskiler/${year}/${month}/${year}${month}${day}.pdf`;

          const formatted = date.toLocaleDateString("tr-TR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          });

          return (
            <li
              key={url}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white p-4 rounded-lg shadow-md hover:translate-y-[-2px] hover:shadow-lg transition duration-300 ease-in-out"
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold tracking-wide flex items-center justify-between"
              >
                <span>{formatted} günü Resmî Gazete</span>
                <span className="ml-4 text-2xl">›</span>
              </a>
            </li>
          );
        })}
      </ul>
      <div className="mt-8 text-center">
        {visibleCount < dates.length && (
          <button
            onClick={() => setVisibleCount((prev) => prev + 7)}
            className="text-md px-5 py-2 mt-6 bg-gradient-to-r from-[#FF6B00] to-[#FFC300] text-white font-semibold rounded-full shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300"
          >
            Devamını Gör
          </button>
        )}
      </div>
    </div>
  );
}
