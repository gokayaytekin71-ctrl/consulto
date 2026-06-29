"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

const FOOTER_HIDDEN_PATHS = ["/calisma-alani", "/dilekce", "/bot", "/notlarim", "/profilim/notlarim"];

export default function ConditionalFooter() {
  const pathname = usePathname();
  const hidden = FOOTER_HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (hidden) return null;
  return <Footer />;
}
