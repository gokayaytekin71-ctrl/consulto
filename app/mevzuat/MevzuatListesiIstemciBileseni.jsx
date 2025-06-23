"use client";

import { useState } from "react";
import { useTransition } from "react";
import LoadingOverlay from "@/components/LoadingOverlay";
import Link from "next/link";
import { useRouter } from "next/navigation";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function MevzuatListesiIstemciBileseni({
  initialMevzuatlar,
  listeBasligi,
  toplamMevzuatSayisi,
  mevcutAramaSorgusu
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(mevcutAramaSorgusu || '');
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.set('q', searchTerm.trim());
    }
    // Arama boşsa 'q' parametresi eklenmez ve popüler liste gelir.
    startTransition(() => {
      router.push(`/mevzuat?${params.toString()}`);
    });
  };

  return (
    <>
      {isPending && <LoadingOverlay />}
      <main className="flex h-screen bg-[#F5F5DC]">
      <aside className="w-80 bg-gradient-to-b from-[#001f3f] to-[#004365] text-[#F5F5DC] h-full flex flex-col shadow-lg">
        <div className="px-6 py-5 border-b border-[#00253a]">
          <h1 className="text-2xl font-bold">Mevzuatlar</h1>
          <p className="text-xs mt-1 text-[#F5F5DC] opacity-80">
            Toplam {toplamMevzuatSayisi} mevzuat bulunmaktadır.
          </p>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Mevzuat ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={classNames(
                "w-full mt-4 border rounded px-3 py-2 text-sm focus:outline-none focus:ring",
                "bg-[#003250] border-[#004365] text-[#F5F5DC] placeholder-[#B0C4DE] focus:ring-[#005A87] focus:border-[#005A87]"
              )}
            />
          </form>
        </div>
        
        <div className="px-6 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-[#E0E0E0]">{listeBasligi}</h2>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pt-1">
          {initialMevzuatlar.length > 0 ? (
            initialMevzuatlar.map(({ key, name }) => (
              <Link
                key={key}
                href={`/mevzuat/${encodeURIComponent(key)}`}
                className="block w-full text-left px-4 py-3 my-1.5 rounded-lg text-[15px] font-normal bg-[#002c48] border border-[#004365] shadow-sm hover:bg-[#003e63] hover:border-[#005A87] hover:shadow-lg active:bg-[#004a78] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#005A87] focus:ring-offset-2 focus:ring-offset-[#001f3f] transition-all duration-150 ease-in-out"
              >
                {name}
              </Link>
            ))
          ) : (
            <p className="px-6 py-4 text-[#B0C4DE] italic text-sm">
              {mevcutAramaSorgusu
                ? "Arama kriterlerinize uygun mevzuat bulunamadı."
                : "Listelenecek popüler mevzuat bulunamadı."}
            </p>
          )}
        </nav>
      </aside>
      <div className="flex-1 p-8">
        <h2 className="text-3xl text-[#001f3f]">Bir mevzuat seçiniz</h2>
        <p className="mt-2 text-gray-600">İçeriği görüntülemek için sol menüden bir mevzuat seçin veya arama yapın.</p>
      </div>
    </main>
    </>
  );
}