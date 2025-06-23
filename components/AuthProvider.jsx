// Konum: app/components/AuthProvider.jsx

"use client";

import { SessionProvider } from "next-auth/react";

// Fonksiyonun başında 'export default' yazdığından %100 emin olun.
export default function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}