// components/TokenBalance.js
"use client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/app/context/ThemeContext";

export default function TokenBalance() {
  const { data: session, update } = useSession();
  const { isDarkMode } = useTheme();
  const balance = session?.user?.tokenBalance || 0;
  const empty = balance <= 0;

  useEffect(() => { if (session) update(); }, []);

  return (
    <div className="mx-4 mb-4">
      <div
        className={`flex items-center justify-between rounded-xl border p-1 pr-1.5 transition-colors
          ${isDarkMode
            ? "border-white/10 bg-[#0D1322]"
            : "border-[#E4DAC6] bg-white shadow-sm"}`}
      >
        {/* Sol: durum noktası + bakiye */}
        <div className="flex items-center gap-2.5 px-3 py-1.5">
          <span
            className={`h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]
              ${empty ? "bg-red-500 text-red-500" : "bg-emerald-500 text-emerald-500"}`}
          ></span>
          <span className={`font-mono text-sm font-bold ${isDarkMode ? "text-slate-100" : "text-[#1C2A47]"}`}>
            {balance}{" "}
            <span className={`font-normal ${isDarkMode ? "text-slate-500" : "text-[#8A8270]"}`}>Token</span>
          </span>
        </div>

        {/* Sağ: Yükle */}
        <Link
          href="/paketler-ucretler"
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors
            ${isDarkMode
              ? "bg-amber-400/15 text-amber-200 hover:bg-amber-400/25"
              : "bg-[#16223E] text-white hover:bg-[#1f2f54]"}`}
        >
          + Yükle
        </Link>
      </div>
    </div>
  );
}
