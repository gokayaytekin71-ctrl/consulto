// components/TokenBalance.js
"use client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import Link from "next/link";

export default function TokenBalance() {
  const { data: session, update } = useSession();
  const balance = session?.user?.tokenBalance || 0;

  useEffect(() => { if (session) update(); }, []);

  return (
    <div className="mx-4 mb-4">
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0B1120] p-1 pr-1.5">
        
        {/* Sol Kısım: Ikon ve Sayı */}
        <div className="flex items-center gap-3 px-3 py-1.5">
          <div className={`h-2 w-2 rounded-full shadow-[0_0_8px_currentColor] ${balance > 0 ? "bg-emerald-500 text-emerald-500" : "bg-red-500 text-red-500"}`}></div>
          <span className="font-mono text-sm font-bold text-slate-200">
            {balance} <span className="text-slate-500 font-normal">Token</span>
          </span>
        </div>

        {/* Sağ Kısım: Yükle Butonu */}
        <Link 
          href="/paketler-ucretler"
          className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          + Yükle
        </Link>
      </div>
    </div>
  );
}