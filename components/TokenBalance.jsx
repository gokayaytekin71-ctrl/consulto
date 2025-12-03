"use client";
import { useSession } from "next-auth/react";

export default function TokenBalance() {
  const { data: session } = useSession();
  const balance = session?.user?.tokenBalance || 0;

  return (
    <div className="px-4 py-3 mx-4 mb-4 rounded-xl bg-gradient-to-r from-cyan-950/50 to-blue-950/50 border border-cyan-500/20 flex items-center justify-between shadow-inner">
      <div className="flex flex-col">
        <span className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase">BAKİYE</span>
        <span className="text-xl font-mono text-white font-bold">{balance} TOKEN</span>
      </div>
      <div className="h-8 w-8 rounded-full bg-cyan-500/10 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
        ⚡
      </div>
    </div>
  );
}