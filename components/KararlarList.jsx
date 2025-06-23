// app/components/KararlarList.jsx
"use client";
import { useState, useMemo, useEffect } from 'react'; // useEffect eklendi
import DecisionCard from './DecisionCard';

const ITEMS_PER_PAGE = 6; // Bir sayfada gösterilecek karar sayısı

export default function KararlarList({ initialData = [] }) {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // Mevcut sayfa için state

  const terms = useMemo(() =>
    searchQuery
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean),
    [searchQuery]
  );

  const filtered = useMemo(() => {
    const data = initialData || [];
    if (terms.length === 0) {
      return data;
    }
    return data
      .map(k => {
        const text = k.body.toLowerCase();
        if (!terms.every(term => text.includes(term))) return null;
        const sentences = (k.body.match(/[^\.!\?]+[\.!\?]+/g) || []).map(s => s.trim());
        const matches = sentences
          .filter(s => terms.some(term => s.toLowerCase().includes(term)))
          .slice(0, 2);
        return { ...k, matches };
      })
      .filter(Boolean);
  }, [initialData, terms]);

  // Filtrelenmiş veri (filtered) değiştiğinde (yeni arama vb.) sayfayı 1'e sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [filtered]);

  // Mevcut sayfada gösterilecek kararları hesapla
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const handleSearch = () => {
    setSearchQuery(inputValue);
    // setCurrentPage(1) çağrısı yukarıdaki useEffect tarafından zaten yapılacak (filtered değişeceği için)
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Sayfa numaralarını oluşturmak için yardımcı fonksiyon (opsiyonel, daha gelişmiş sayfalama için)
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Gösterilecek maksimum sayfa sayısı butonu
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1); // Her zaman ilk sayfayı göster
      if (currentPage > halfPagesToShow + 1) {
        pageNumbers.push('...'); // Başa üç nokta
      }

      let startPage = Math.max(2, currentPage - halfPagesToShow + (totalPages - currentPage < halfPagesToShow ? (halfPagesToShow - (totalPages - currentPage)) : 0) );
      let endPage = Math.min(totalPages - 1, currentPage + halfPagesToShow - (currentPage <= halfPagesToShow ? (halfPagesToShow - currentPage +1) : 0) );
      
      // Eğer başlangıç ve bitiş arasında çok az sayfa kalıyorsa, aralığı genişlet.
      if (currentPage <= halfPagesToShow) {
          endPage = Math.min(totalPages -1, maxPagesToShow-1);
      }
      if (totalPages - currentPage < halfPagesToShow){
          startPage = Math.max(2, totalPages - maxPagesToShow +2);
      }


      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (totalPages - currentPage > halfPagesToShow ) {
        pageNumbers.push('...'); // Sona üç nokta
      }
      pageNumbers.push(totalPages); // Her zaman son sayfayı göster
    }
    return pageNumbers.filter((item, index) => pageNumbers.indexOf(item) === index); // Tekrarlananları kaldır (özellikle ... durumlarında)
  };


  return (
    <div className="pt-px pb-6 px-4 sm:px-6">
      {/* Arama Kutusu + Buton */}
      <div className="max-w-xl mx-auto mb-12 flex space-x-4 items-center animate-fade-in-up delay-400">
        <div className="flex items-center flex-1 rounded-full p-[2px]
                        bg-gradient-to-r from-blue-700/50 via-blue-400/50 to-blue-700/50
                        shadow-lg transition">
          <div className="flex items-center w-full bg-blue-900/70 rounded-full px-4 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Örn: kamulaştırma, husumet"
              className="w-full bg-transparent text-blue-100 placeholder-blue-300 focus:outline-none"
            />
          </div>
        </div>
        <button
          onClick={handleSearch}
          className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-full shadow-lg hover:bg-orange-600 transition-colors duration-300 transform hover:scale-105"
        >
          Ara
        </button>
      </div>

      {/* --- Karar Kartları için Izgara (Grid) Yapısı --- */}
      {filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Sadece mevcut sayfadaki kararları render et */}
            {paginatedItems.map((kararData) => (
              <DecisionCard
                key={kararData.id}
                {...kararData}
                terms={terms.length > 0 ? terms : []}
              />
            ))}
          </div>

          {/* --- Sayfalama (Pagination) Kontrolleri --- */}
          {totalPages > 1 && (
            <div className="mt-12 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <span className="text-sm text-gray-400">
                Sayfa {currentPage} / {totalPages} ({filtered.length} sonuç)
              </span>

              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-2 sm:px-4 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Önceki
                </button>

                {getPageNumbers().map((page, index) =>
                  typeof page === 'number' ? (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 sm:px-4 border rounded-md text-sm ${
                        currentPage === page
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={`ellipsis-${index}`} className="px-1 sm:px-2 py-2 text-gray-400">
                      {page} {/* ... */}
                    </span>
                  )
                )}

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 sm:px-4 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        terms.length > 0 && (
          <p className="text-center text-blue-300 mt-10">
            Aramanıza uygun karar bulunamadı.
          </p>
        )
      )}
    </div>
  );
}