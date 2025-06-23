"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "./LoadingOverlay";

// İkonlar (Bunları projenizin yapısına göre taşıyabilirsiniz)
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
);
const LawIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
);
const GavelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600"><path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.655L9.75 21.75l-2.47-2.47.708-.707a8.25 8.25 0 00-3.322-1.41l-.42-.105a2.25 2.25 0 01-1.58-2.585l.348-1.467a2.25 2.25 0 011.05-1.58l9-4.5a2.25 2.25 0 012.585 1.58l1.467 6.164a2.25 2.25 0 01-1.58 2.585l-1.05.262a8.25 8.25 0 01-1.41 3.322l-.707.707-2.47-2.47zM11.412 15.655L14.25 12.828" /></svg>
);


export default function HomePageSearch() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('mevzuat'); // 'mevzuat', 'karar'
    const [loading, setLoading] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        setLoading(true);
        if (searchType === 'mevzuat') {
            router.push(`/mevzuat?q=${encodeURIComponent(searchTerm)}`);
        } else {
            // Kararlar sayfasındaki arama listesi komponenti query parametresini dinler.
            // Bu nedenle kararlar ana sayfasına query ile yönlendiriyoruz.
            router.push(`/kararlar?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    return (
        <>
        {loading && <LoadingOverlay />}
        <form 
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20"
        >
            <div className="bg-white rounded-md flex items-center p-2 shadow-lg">
                <div className="flex items-center pl-2 pr-4 border-r border-gray-200">
                    {searchType === 'mevzuat' ? <LawIcon /> : <GavelIcon />}
                    <select 
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        className="bg-transparent text-[#001f3f] font-semibold focus:outline-none ml-2 cursor-pointer"
                    >
                        <option value="mevzuat">Mevzuat</option>
                        <option value="karar">Karar</option>
                    </select>
                </div>
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={searchType === 'mevzuat' ? "Kanun, yönetmelik ara..." : "Karar metninde ara..."}
                    className="w-full bg-transparent px-4 text-gray-700 placeholder-gray-400 focus:outline-none"
                />
                <button 
                    type="submit"
                    className="bg-orange-500 text-white p-3 rounded-md hover:bg-orange-600 transition-colors flex items-center"
                    aria-label="Ara"
                >
                    <SearchIcon />
                </button>
            </div>
        </form>
        </>
    );
}