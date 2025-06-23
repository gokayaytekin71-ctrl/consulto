'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function ClientDilekceler({ categories }) {
  const [selectedCategory, setSelectedCategory] = useState(
    categories[0]?.category || ''
  );
  const [selectedFile, setSelectedFile] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const sectionRef = useRef(null);

  // Kategori değişince önceki seçimi sıfırla
  useEffect(() => {
    setSelectedFile('');
    setContent('');
  }, [selectedCategory]);

  const loadContent = async (filename) => {
    setSelectedFile(filename);
    setLoading(true);
    try {
      const slug = [
        encodeURIComponent(selectedCategory),
        encodeURIComponent(filename)
      ].join('/');
      const res = await fetch(`/api/dilekceler/${slug}`);
      const json = await res.json();
      setContent(json.content || '— içerik boş —');
    } catch (e) {
      setContent('⚠️ Yüklenirken hata: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // İçerik yüklendiğinde otomatik scroll
  useEffect(() => {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [content]);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-[#001f3f] to-[#004365]">
      {/* --- SOL MENÜ --- */}
      <nav className="w-72 p-4 flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/20 space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-2">
          KATEGORİLER
        </h2>
        <ul className="space-y-1">
          {categories.map(({ category }) => (
            <li key={category}>
              <button
                onClick={() => setSelectedCategory(category)}
                className={`
                  flex items-center w-full px-3 py-2 rounded-lg
                  transition-colors duration-200
                  ${selectedCategory === category 
                    ? 'bg-[#1E90FF]/20 text-[#F9FAFB] font-semibold' 
                    : 'text-[#E5E7EB] hover:bg-[#1E90FF]/20'}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2 text-[#E5E7EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h5l2 3h11v11H3z" />
                </svg>
                {category}
              </button>
            </li>
          ))}
        </ul>

        <h2 className="mt-6 text-sm font-bold uppercase tracking-wider mb-2">
          DİLEKÇELER
        </h2>
        <ul className="space-y-1">
          {(categories.find(c => c.category === selectedCategory)?.files ||
            []).map((fn) => (
            <li key={fn}>
              <button
                onClick={() => loadContent(fn)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg
                  transition-colors duration-200
                  ${selectedFile === fn 
                    ? 'bg-[#1E90FF]/20 text-[#F9FAFB] font-semibold' 
                    : 'text-[#E5E7EB] hover:bg-[#1E90FF]/20'}
                `}
              >
                {fn}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* --- SAĞ İÇERİK --- */}
      <main className="flex-1 p-6 bg-[#F3F4F6] overflow-auto">
        {loading && <p>Yükleniyor…</p>}
        {!loading && selectedFile && (
          <section
            ref={sectionRef}
            className="relative mb-6"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-[#1E90FF] rounded-t-lg"></div>
            <div className="bg-white rounded-2xl shadow-xl p-8 pt-10 font-sans">
              <h1 className="text-2xl font-semibold text-gray-800 font-sans">{selectedFile}</h1>
              <pre className="font-sans text-base leading-relaxed text-gray-700 whitespace-pre-wrap break-words">
                {content}
              </pre>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}