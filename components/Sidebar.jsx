"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; 
import React from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";

function getSafeImageSrc(raw) {
  if (!raw || typeof raw !== "string") return "https://ui-avatars.com/api/?background=0f172a&color=fff&name=User";
  if (!raw.startsWith("/") && !raw.startsWith("http")) return "https://ui-avatars.com/api/?background=0f172a&color=fff&name=User";
  return raw;
}

function getSafeText(v, fallback = "") {
  if (typeof v !== "string") return fallback;
  const t = v.trim();
  return t.length ? t : fallback;
}

export default function Sidebar({ items = [], session }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const avatarSrc = getSafeImageSrc(session?.user?.image);
  const name = getSafeText(session?.user?.name, "Kullanıcı");
  const email = getSafeText(session?.user?.email, "");

  return (
    <aside
      className={`
        relative h-full flex flex-col justify-between
        bg-[#0f172a]/95 backdrop-blur-xl border-r border-white/5 shadow-2xl
        transition-all duration-500 ease-in-out z-50
        ${collapsed ? "w-20" : "w-72"}
      `}
    >
      {/* Dekoratif Glow */}
      <div className="absolute top-0 left-0 w-full h-2/3 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none" />

      {/* --- ÜST KISIM (Profil) --- */}
      <div className="p-6 border-b border-white/5 relative z-10 shrink-0">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="relative shrink-0 group cursor-pointer">
             <div className={`absolute -inset-0.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur opacity-30 group-hover:opacity-75 transition duration-500 ${collapsed ? "w-10 h-10" : "w-12 h-12"}`}></div>
             <div className={`relative rounded-full p-[2px] bg-slate-950 ring-1 ring-white/10 ${collapsed ? "w-10 h-10" : "w-12 h-12"}`}>
                <Image src={avatarSrc} alt="Profile" fill className="rounded-full object-cover" />
             </div>
             <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
          </div>
          <div className={`flex flex-col overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
            <span className="text-sm font-bold text-white truncate">{name}</span>
            <span className="text-[10px] text-slate-400 truncate">{email}</span>
          </div>
        </div>
      </div>

      {/* --- ORTA KISIM (Menü Linkleri) --- */}
      {/* flex-1 verdik ki boşluğu doldursun */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 custom-scrollbar">
        {Array.isArray(items) && items.map(({ href, onClick, icon, label }) => {
          const Wrapper = href ? Link : "button";
          const isActive = href ? pathname === href : false;
          
          return (
            <Wrapper
              key={label}
              href={href}
              onClick={onClick}
              className={`
                group relative flex items-center w-full rounded-xl transition-all duration-200
                ${collapsed ? "justify-center p-3" : "px-4 py-3 gap-3"}
                ${isActive 
                  ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)] border border-cyan-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}
              `}
              title={collapsed ? label : ""}
            >
              {!collapsed && isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_10px_#22d3ee]"></div>
              )}
              <span className={`text-xl transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                {React.cloneElement(icon, { className: "w-5 h-5" })}
              </span>
              <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"}`}>
                {label}
              </span>
            </Wrapper>
          );
        })}
      </nav>

      {/* --- ALT KISIM (Ayarlar & Çıkış) --- */}
      {/* shrink-0 verdik ki sıkışmasın */}
      <div className="p-3 border-t border-white/5 space-y-1 relative z-10 shrink-0 bg-[#0f172a]/50 backdrop-blur-sm">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`group flex items-center w-full rounded-xl p-3 text-slate-400 hover:bg-white/5 hover:text-white transition-all ${collapsed ? "justify-center" : "gap-3"}`}
        >
          <div className="p-1.5 rounded-lg bg-slate-900 border border-white/10 group-hover:border-cyan-500/50 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
             </svg>
          </div>
          <span className={`text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>Gizle</span>
        </button>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/cikis" })}
          className={`group flex items-center w-full rounded-xl p-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all ${collapsed ? "justify-center" : "gap-3"}`}
          title="Çıkış Yap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H12" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H6a2 2 0 00-2 2v10a2 2 0 002 2h3" />
          </svg>
          <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}