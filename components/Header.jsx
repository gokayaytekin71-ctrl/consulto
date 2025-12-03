// app/components/Header.jsx
"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";
import React from "react"; // React.cloneElement için gerekli

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
import animationData from "../animations/Animation1.json";

/* --- İKONLAR --- */
const Icons = {
  User: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  Gavel: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  FileText: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>,
  Cpu: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 14h3"/><path d="M1 9h3"/><path d="M1 14h3"/></svg>,
  Tool: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  Package: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
  // YENİ İKONLAR
  Library: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
  Feather: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>,
  Scroll: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M19 3h-1a1 1 0 0 0-1 1v13H4a2 2 0 0 0-2 2 2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3z" /><path d="M8 21h12a2 2 0 0 0 2-2v-1h-10" /><path d="M10 3v16" /></svg>
};

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
  const [isOtherOpen, setIsOtherOpen] = useState(false);
  
  const notificationsRef = useRef(null);
  const otherRef = useRef(null);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoadingNotifications(true);
      try {
        const [tasksRes, hearingsRes] = await Promise.all([fetch("/api/tasks"), fetch("/api/hearings")]);
        const tasksData = tasksRes.ok ? await tasksRes.json() : [];
        const hearingsData = hearingsRes.ok ? await hearingsRes.json() : [];
        const combinedItems = [...tasksData.map(i => ({ ...i, type: 'Görev' })), ...hearingsData.map(i => ({ ...i, type: 'Duruşma' }))];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const upcomingItems = combinedItems.filter(i => new Date(i.date) >= today).sort((a, b) => new Date(a.date) - new Date(b.date));
        setNotifications(upcomingItems);
      } catch (error) { console.error("Bildirim hatası:", error); } finally { setIsLoadingNotifications(false); }
    };
    if (status === "authenticated") fetchNotifications();
  }, [status]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) setIsNotificationsOpen(false);
      if (otherRef.current && !otherRef.current.contains(event.target)) setIsOtherOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNav = (path) => { if(pathname === path) return; startTransition(() => router.push(path)); };
  const authButtonsPlaceholder = <div className="w-8 h-8 bg-slate-700/50 animate-pulse rounded-full"></div>;

  const NavItem = ({ onClick, icon: Icon, label, active }) => (
    <button onClick={onClick} className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-300 ${active ? "bg-white/10 text-white shadow-[0_0_10px_rgba(56,189,248,0.25)]" : "text-slate-300 hover:text-white hover:bg-white/5"}`}>
      <Icon />
      <span className="text-[11px] font-medium tracking-wide hidden lg:block group-hover:block transition-all duration-300">{label}</span>
      {active && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_3px_cyan]"></span>}
    </button>
  );

  return (
    <>
      {isPending && <LoadingOverlay />}
      
      <header className="fixed top-3 left-1/2 transform -translate-x-1/2 z-[9999] w-[92%] max-w-[850px]">
        <div className="relative flex items-center justify-between px-3 py-1.5 rounded-full bg-[#001f3f]/90 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/20 transition-all duration-500 hover:border-white/20 hover:shadow-cyan-900/15">

          {/* LOGO */}
          <div className="flex-shrink-0 pl-1 pr-3 border-r border-white/10">
            <Link href="/" className="block transition-transform hover:scale-105 active:scale-95">
              <Image src="/images/logo.png" alt="Logo" width={90} height={24} className="object-contain brightness-110 drop-shadow-lg" priority />
            </Link>
          </div>
          
          <div className="hidden lg:flex items-center pl-2 pr-4 opacity-90"><div className="w-10 h-10"><Lottie animationData={animationData} loop autoPlay /></div></div>

          {/* MENÜ - Kompakt */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-0.5 px-2">
            <NavItem onClick={() => handleNav("/kararlar")} icon={Icons.Gavel} label="Kararlar" active={pathname === "/kararlar"} />
            <NavItem onClick={() => handleNav("/akilli-arama")} icon={Icons.Search} label="Arama" active={pathname === "/akilli-arama"} />
            <NavItem onClick={() => handleNav("/dilekce")} icon={Icons.FileText} label="Dilekçe" active={pathname === "/dilekce"} />
            <NavItem onClick={() => handleNav("/bot")} icon={Icons.Cpu} label="Analiz" active={pathname === "/bot"} />
            <NavItem onClick={() => handleNav("/araclar")} icon={Icons.Tool} label="Araçlar" active={pathname === "/araclar"} />
            <NavItem onClick={() => handleNav("/paketler-ucretler")} icon={Icons.Package} label="Paketler" active={pathname === "/paketler-ucretler"} />

            {/* Diğer */}
            <div className="relative ml-1" ref={otherRef}>
              <button onClick={() => setIsOtherOpen(!isOtherOpen)} className={`group flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${isOtherOpen ? 'bg-white/20 text-white rotate-90' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                <Icons.Menu />
              </button>
              {isOtherOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-40 p-1.5 rounded-xl bg-[#0a1b2b]/95 backdrop-blur-md border border-white/10 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex flex-col gap-0.5">
                    {[
                      { href: "/mevzuat", label: "Mevzuat", icon: <Icons.Library /> },
                      { href: "/makaleler", label: "Makaleler", icon: <Icons.Feather /> },
                      { href: "/gazete", label: "Resmî Gazete", icon: <Icons.Scroll /> }
                    ].map((link) => (
                      <Link key={link.href} href={link.href} onClick={() => setIsOtherOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition-colors">
                        <span className="w-4 h-4 flex items-center justify-center">{link.icon}</span>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* SAĞ KISIM */}
          <div className="flex items-center gap-2 pl-3 border-l border-white/10">
            {isMounted ? (status === "loading" ? authButtonsPlaceholder : session ? (
              <>
                <div className="relative" ref={notificationsRef}>
                  <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300 active:scale-90">
                    <Icons.Bell />
                    {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-[#001f3f]"></span></span>}
                  </button>
                  {isNotificationsOpen && (
                    <div className="absolute top-full right-0 mt-3 w-80 rounded-2xl bg-[#0f263d]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5"><h3 className="font-semibold text-white text-sm">Bildirimler</h3><span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300">{notifications.length} Yeni</span></div>
                      <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                        {isLoadingNotifications ? <div className="p-4 text-center text-slate-400 text-xs">Yükleniyor...</div> : notifications.length > 0 ? (
                          <ul className="divide-y divide-white/5">
                            {notifications.slice(0, 5).map((item) => (
                              <li key={`${item.type}-${item.id}`}>
                                <Link href="/profilim/gorevlerim" onClick={() => setIsNotificationsOpen(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors group">
                                  <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.type === 'Görev' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.5)]'}`}></div>
                                  <div><p className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors">{item.content}</p><p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1"><span>{item.type}</span><span>•</span><span>{new Date(item.date).toLocaleDateString('tr-TR')}</span></p></div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : <div className="p-6 text-center text-slate-500 text-xs">Her şey yolunda!</div>}
                      </div>
                      <div className="p-1.5 bg-white/5 border-t border-white/5 text-center"><Link href="/profilim/gorevlerim" onClick={() => setIsNotificationsOpen(false)} className="block w-full py-1.5 text-[10px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors">Tüm Ajandayı Görüntüle →</Link></div>
                    </div>
                  )}
                </div>
                <Link href="/profilim" onClick={() => handleNav("/profilim")} className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-full hover:bg-white/10 transition-all duration-300 group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1.5px] shadow-md shadow-cyan-900/30 group-hover:shadow-cyan-500/30 transition-shadow">
                    <div className="w-full h-full rounded-full bg-[#001f3f] flex items-center justify-center"><Icons.User /></div>
                  </div>
                </Link>
              </>
            ) : (
              <button onClick={() => signIn(undefined, { callbackUrl: "/profilim" })} className="px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-600 text-white text-xs font-bold shadow-md shadow-orange-900/20 hover:shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all duration-300">Giriş</button>
            )) : authButtonsPlaceholder}
          </div>
        </div>
      </header>
    </>
  );
}