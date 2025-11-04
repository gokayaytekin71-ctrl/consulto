// Konum: app/components/SignOutButton.jsx
"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/cikis" })} // 👈 burayı değiştirdik
      className="w-full bg-red-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors text-left"
    >
      Çıkış Yap
    </button>
  );
}