"use client";
import { useState } from "react";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";

// HATALI/BOŞ src'leri güvenli hale getirir
function getSafeImageSrc(raw) {
  if (!raw || typeof raw !== "string") return "/default-avatar.png";
  if (!raw.startsWith("/") && !raw.startsWith("http")) return "/default-avatar.png";
  return raw;
}

// Boş/undefined metinler için güvenli metin döndürür
function getSafeText(v, fallback = "") {
  if (typeof v !== "string") return fallback;
  const t = v.trim();
  return t.length ? t : fallback;
}

export default function Sidebar({ items = [], session }) {
  const [collapsed, setCollapsed] = useState(false);
  const avatarSrc = getSafeImageSrc(session?.user?.image);
  const name = getSafeText(session?.user?.name, "Kullanıcı");
  const email = getSafeText(session?.user?.email, "");

  return (
    <aside
      className={`flex-shrink-0 bg-[#0f1a2b] text-white p-6 border-r border-gray-800 shadow-xl transition-all duration-300 ${
        collapsed ? "w-16" : "w-72"
      } flex flex-col`}
    >
      <div className="flex items-center justify-between mb-6">
        {!collapsed && session?.user && (
          <div className="flex items-center gap-3">
            <Image
              src={avatarSrc}
              alt={name || "Profil Resmi"}
              width={72}
              height={72}
              className="rounded-full border-2 border-orange-500 object-cover"
            />
            <div className="flex flex-col">
              <span className="font-medium">{name}</span>
              <span className="text-xs text-gray-400 truncate">{email}</span>
            </div>
          </div>
        )}
      </div>
      <nav className="flex flex-col gap-2">
        {Array.isArray(items) && items.map(({ href, onClick, icon, label }) => {
          const Wrapper = href ? Link : "button";
          const props = href
            ? { href }
            : { onClick };
          return (
            <Wrapper
              key={label}
              {...props}
              className={
                collapsed
                  ? "flex justify-center p-2 transition"
                  : "flex justify-between p-3 bg-[#1f2a3a] rounded-lg hover:bg-[#253445] transition"
              }
            >
              <div className="flex items-center space-x-2">
                {collapsed ? (
                  <span className="bg-[#1f2a3a] p-2 rounded-full">
                    {React.isValidElement(icon) ? React.cloneElement(icon, { className: "text-cyan-400 text-2xl" }) : null}
                  </span>
                ) : (
                  React.isValidElement(icon) ? React.cloneElement(icon, { className: "text-cyan-400 text-2xl" }) : null
                )}
                {!collapsed && <span className="pl-2">{label}</span>}
              </div>
            </Wrapper>
          );
        })}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={
            collapsed
              ? "flex justify-center p-2 transition"
              : "flex justify-between p-3 bg-[#1f2a3a] rounded-lg hover:bg-[#253445] transition"
          }
        >
          <div className="flex items-center space-x-2">
            <span className="bg-[#1f2a3a] p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-cyan-400 w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M4 12h16m-6-6l6 6-6 6" : "M20 12H4m6-6l-6 6 6 6"} />
              </svg>
            </span>
            {!collapsed && <span className="text-cyan-400 whitespace-nowrap text-sm font-medium">Menüyü Gizle</span>}
          </div>
        </button>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/cikis" })}
          className={
            collapsed
              ? "flex justify-center p-2 transition"
              : "flex justify-between p-3 bg-[#1f2a3a] rounded-lg hover:bg-[#253445] transition"
          }
        >
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="text-red-500 w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H12" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H6a2 2 0 00-2 2v10a2 2 0 002 2h3" />
            </svg>
            {!collapsed && (
              <span className="text-red-400 whitespace-nowrap text-sm font-medium">
                Çıkış Yap
              </span>
            )}
          </div>
        </button>
      </nav>
    </aside>
  );
}