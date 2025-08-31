// app/components/Header.jsx
"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
import animationData from "../animations/Animation1.json";

// İkonlar (değişiklik yok)
const UserCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (pathname.includes("/auth/signin") || pathname.includes("/api/auth/signin")) return null;

  const { data: session, status } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const notificationsRef = useRef(null);

  const [isOtherOpen, setIsOtherOpen] = useState(false);
  const otherRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoadingNotifications(true);
      try {
        const [tasksRes, hearingsRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/hearings"),
        ]);

        const tasksData = tasksRes.ok ? await tasksRes.json() : [];
        const hearingsData = hearingsRes.ok ? await hearingsRes.json() : [];

        const combinedItems = [
          ...tasksData.map(item => ({ ...item, type: 'Görev' })),
          ...hearingsData.map(item => ({ ...item, type: 'Duruşma' }))
        ];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingItems = combinedItems
          .filter(item => new Date(item.date) >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setNotifications(upcomingItems);

      } catch (error) {
        console.error("Bildirimler alınamadı:", error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (otherRef.current && !otherRef.current.contains(event.target)) {
        setIsOtherOpen(false);
      }
    }
    if (isOtherOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOtherOpen]);


  const authButtonsPlaceholder = (
    <div className="w-24 h-8 bg-slate-700 animate-pulse rounded-md"></div>
  );

  return (
    <header
      className="sticky top-0 z-50 relative
                 bg-gradient-to-b from-[#001f3f] to-[#004365]
                 text-[#F5F5DC] flex items-center justify-between
                 px-4 sm:px-6 py-1 shadow-md"
    >
      {isPending && <LoadingOverlay />}
      <div className="flex-none">
        <Link href="/">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={120}
            height={34}
            className="cursor-pointer hover:opacity-90 object-contain"
            style={{ cursor: "pointer" }}
          />
        </Link>
      </div>

      <div
        className="absolute left-1/2 top-1/2
                   transform -translate-x-1/2 -translate-y-1/2
                   w-16 h-16 pointer-events-none hidden md:block"
      >
        <Lottie animationData={animationData} loop autoPlay />
      </div>

      <nav className="flex-none flex items-center space-x-3 sm:space-x-4 text-sm sm:text-base">
        {/* Diğer Linkler (değişiklik yok) */}
        <Link href="/kararlar" onClick={(e) => { e.preventDefault(); startTransition(() => { router.push("/kararlar"); }); }} className="flex flex-col items-center p-2 transition-transform transform hover:scale-110 cursor-pointer">
           <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#001f3f] to-[#004365] rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-300">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7v2h20V7L12 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 9v10h16V9H4z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 9v10M12 9v10M16 9v10" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 19h20" /></svg>
           </div>
           <span className="mt-0.5 text-xs text-white">Kararlar</span>
         </Link>
         {/* Akıllı Arama Linki */}  
          <a
         href="/akilli-arama"
         className="flex flex-col items-center p-2 transition-transform transform hover:scale-110 cursor-pointer"
       >
         <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#001f3f] to-[#004365] rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-300">
           {/* Lupa ikonu */}
           <svg xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
           >
             <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
           </svg>
         </div>
         <span className="mt-0.5 text-xs text-white">Akıllı Arama</span>
       </a>

         <Link href="/dilekce" onClick={(e) => { e.preventDefault(); startTransition(() => { router.push("/dilekce"); }); }} className="flex flex-col items-center p-2 transition-transform transform hover:scale-110 cursor-pointer">
           <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#001f3f] to-[#004365] rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-300">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H8a2 2 0 00-2 2v14l4-4h6a2 2 0 002-2V5a2 2 0 00-2-2z" />
               <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6M9 12h6M9 16h4" />
             </svg>
           </div>
           <span className="mt-0.5 text-xs text-white">Dilekçe Pro</span>
         </Link>

         <Link href="/bot" onClick={(e) => { e.preventDefault(); startTransition(() => { router.push("/bot"); }); }} className="flex flex-col items-center p-2 transition-transform transform hover:scale-110 cursor-pointer">
           <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#001f3f] to-[#004365] rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-300">
             <svg
               xmlns="http://www.w3.org/2000/svg"
               className="w-5 h-5 text-white"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               strokeWidth="1.8"
               strokeLinecap="round"
               strokeLinejoin="round"
             >
               {/* Neural network / AI icon */}
               <circle cx="12" cy="12" r="3" />
               <path d="M12 5v2M12 17v2M5 12h2M17 12h2M7.8 7.8l1.4 1.4M14.8 14.8l1.4 1.4M16.2 7.8l-1.4 1.4M9.8 14.8l-1.4 1.4" />
               <circle cx="12" cy="4" r="1" />
               <circle cx="12" cy="20" r="1" />
               <circle cx="4" cy="12" r="1" />
               <circle cx="20" cy="12" r="1" />
             </svg>
           </div>
           <span className="mt-0.5 text-xs text-white">Analiz Pro</span>
         </Link>

         <Link href="/araclar" onClick={(e) => { e.preventDefault(); startTransition(() => { router.push("/araclar"); }); }} className="flex flex-col items-center p-2 transition-transform transform hover:scale-110 cursor-pointer">
           <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#001f3f] to-[#004365] rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-300">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
             </svg>
           </div>
           <span className="mt-0.5 text-xs text-white">Araçlar</span>
         </Link>
      
         <div className="relative" ref={otherRef}>
           <button
             onClick={() => setIsOtherOpen(prev => !prev)}
             aria-label="Diğer"
             aria-expanded={isOtherOpen}
             className={`flex flex-col items-center p-2 transition-transform transform hover:scale-110 cursor-pointer ${isOtherOpen ? 'scale-110' : ''}`}
           >
             <div className={`w-8 h-8 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 bg-gradient-to-br from-[#001f3f] to-[#004365] ${isOtherOpen ? 'ring-2 ring-cyan-400/50' : ''}`}>
               {/* üç nokta ikonu */}
               <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                 <circle cx="5" cy="12" r="1.8" />
                 <circle cx="12" cy="12" r="1.8" />
                 <circle cx="19" cy="12" r="1.8" />
               </svg>
             </div>
             <span className="mt-0.5 text-xs text-white">Diğer</span>
           </button>

           {isOtherOpen && (
             <div className="absolute top-full right-0 mt-2 z-50">
               {/* küçük caret */}
               <div className="absolute -top-1.5 right-4 w-3 h-3 bg-[#0a1b2b] border-t border-l border-slate-700/70 rotate-45 rounded-[2px]"></div>
               {/* panel */}
               <div className="relative w-48 overflow-hidden rounded-lg border border-slate-700/70 bg-[#0a1b2b]/95 backdrop-blur-sm shadow-xl ring-1 ring-white/10">
                 <ul className="py-1 text-[13px] text-slate-100/90">
                   <li>
                     <Link href="/mevzuat" onClick={() => setIsOtherOpen(false)} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors rounded-md mx-1">
                       {/* book icon */}
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-cyan-300/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20" />
                         <path d="M20 2H6.5A2.5 2.5 0 0 0 4 4.5v15" />
                         <path d="M8 6h9" />
                         <path d="M8 10h9" />
                       </svg>
                       <span>Mevzuat</span>
                     </Link>
                   </li>
                   <li>
                     <Link href="/makaleler" onClick={() => setIsOtherOpen(false)} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors rounded-md mx-1">
                       {/* doc icon */}
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-cyan-300/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                         <path d="M14 3v5h5" />
                         <path d="M9 13h6" />
                         <path d="M9 17h4" />
                       </svg>
                       <span>Makaleler</span>
                     </Link>
                   </li>
                   <li>
                     <Link href="/gazete" onClick={() => setIsOtherOpen(false)} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors rounded-md mx-1">
                       {/* newspaper icon */}
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-cyan-300/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M4 19h16a2 2 0 0 0 2-2V7H6a2 2 0 0 0-2 2z" />
                         <path d="M22 7V5a2 2 0 0 0-2-2H4v16" />
                         <path d="M8 11h8" />
                         <path d="M8 15h6" />
                       </svg>
                       <span>Gazete</span>
                     </Link>
                   </li>
                 </ul>
               </div>
             </div>
           )}
         </div>
        
        {isMounted ? (
          status === "loading" ? (
            authButtonsPlaceholder
          ) : session ? (
            <>
              {/* BİLDİRİMLER BÖLÜMÜ */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(prev => !prev)}
                  aria-label="Bildirimler"
                  className="flex flex-col items-center p-2 transition-transform transform hover:scale-110 cursor-pointer"
                >
                  <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#001f3f] to-[#004365] rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-300">
                    <BellIcon className="w-6 h-6 text-white" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                    )}
                  </div>
                  <span className="mt-0.5 text-xs text-white">Bildirim</span>
                </button>
                
                {isNotificationsOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-[#002b4a] border border-gray-600 rounded-lg shadow-xl text-white z-50">
                    <div className="p-3 border-b border-gray-600 font-semibold">
                      Yaklaşanlar
                    </div>
                    {/* GÜNCELLENDİ: ul ve li yapısı Link bileşenini içerecek şekilde değiştirildi */}
                    <ul className="py-1 max-h-80 overflow-y-auto">
                      {isLoadingNotifications ? (
                        <li className="px-4 py-2 text-sm text-gray-300">Yükleniyor...</li>
                      ) : notifications.length > 0 ? (
                        notifications.slice(0, 5).map((item) => (
                          <li key={`${item.type}-${item.id}`}>
                            <Link
                              href="/profilim/gorevlerim"
                              onClick={() => setIsNotificationsOpen(false)} // Tıklanınca menüyü kapat
                              className="block px-4 py-3 hover:bg-[#003f6a] transition-colors duration-150 border-b border-gray-700 last:border-b-0 cursor-pointer"
                            >
                              <p className={`font-semibold text-sm flex items-center gap-2 ${item.type === 'Görev' ? 'text-green-300' : 'text-orange-300'}`}>
                                <span>{item.type === 'Görev' ? '✅' : '⚖️'}</span>
                                {item.content}
                              </p>
                              <p className="text-xs text-gray-400 mt-1 pl-6">
                                Tarih: {new Date(item.date).toLocaleDateString('tr-TR')}
                              </p>
                            </Link>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-2 text-sm text-gray-300">Yaklaşan görev veya duruşma yok.</li>
                      )}
                    </ul>
                    <div className="p-2 border-t border-gray-600 text-center">
                      <Link href="/profilim/gorevlerim" onClick={() => setIsNotificationsOpen(false)} className="text-sm text-orange-400 hover:text-orange-300 font-semibold">
                        Tümünü Gör
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/profilim"
                onClick={(e) => { e.preventDefault(); startTransition(() => { router.push("/profilim"); }); }}
                className="flex flex-col items-center p-2 transition-transform transform hover:scale-110 cursor-pointer"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#001f3f] to-[#004365] rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <UserCircleIcon className="w-6 h-6 text-white" />
                </div>
                <span className="mt-0.5 text-xs text-white">Profilim</span>
              </Link>
            </>
          ) : (
            <button
              onClick={() => signIn(undefined, { callbackUrl: "/profilim" })}
              className="bg-orange-500 px-4 py-2 rounded-md hover:bg-orange-600 transition text-white font-semibold cursor-pointer"
            >
              Giriş
            </button>
          )
        ) : (
          authButtonsPlaceholder
        )}
      </nav>
    </header>
  );
}