"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function GundemSection({ items }) {
  if (!items || items.length === 0) return null;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = items[selectedIndex];

  return (
    <section className="w-full bg-gray-100 py-12 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className="md:w-1/4 pr-4">
        <nav className="sticky top-24 space-y-3 bg-white bg-opacity-50 backdrop-blur-lg p-4 rounded-md shadow-md">
          {items.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 ${
                idx === selectedIndex
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-indigo-100 hover:text-indigo-700"
              }`}
            >
              <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
                idx === selectedIndex ? "bg-white" : "bg-gray-400"
              }`} />
              <span className="font-medium">{item.title}</span>
            </button>
          ))}
        </nav>
      </aside>
      {/* Content */}
      <div className="md:w-3/4 bg-white p-6 rounded-2xl shadow-lg overflow-hidden transition-transform duration-300 hover:shadow-xl">
        <div className="group w-full h-80 relative rounded-xl overflow-hidden shadow-xl transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:rotate-1 perspective-1000">
          <Image
            src={selected.imageUrl}
            alt={selected.title}
            fill
            className="object-cover transform transition-transform duration-500 group-hover:rotate-2 group-hover:scale-110"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/30 backdrop-blur-md rounded-full px-6 py-4 text-center max-w-[60%] group transform transition-all duration-300 ease-out hover:scale-105 overflow-hidden hover:shadow-2xl hover:border-2 hover:border-indigo-300">
              <p className="text-sm text-gray-800 mt-1 line-clamp-2">
                {selected.content}
              </p>
              <Link
                href={`/gundem/${selected.id}`}
                className="mt-4 inline-flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-6 py-3 rounded-full shadow-lg transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Devamını Gör
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
            </div>
          </div>
          {/* Previous Icon */}
          <button
            onClick={() => setSelectedIndex((selectedIndex - 1 + items.length) % items.length)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/50 hover:bg-white/70 p-2 rounded-full shadow-md transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {/* Next Icon */}
          <button
            onClick={() => setSelectedIndex((selectedIndex + 1) % items.length)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/50 hover:bg-white/70 p-2 rounded-full shadow-md transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}