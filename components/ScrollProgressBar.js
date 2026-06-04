// components/ScrollProgressBar.js
"use client";

import { useEffect, useState } from "react";

export default function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = totalScroll / windowHeight;
      setScrollProgress(Number.isNaN(scroll) ? 0 : scroll);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 h-[3px] z-[100] print:hidden transition-all duration-100 ease-out"
      style={{
        width: `${scrollProgress * 100}%`,
        background: "linear-gradient(90deg, #0f2a4a 0%, #163a63 55%, #b8860b 100%)",
        boxShadow: "0 0 8px rgba(184,134,11,0.35)",
      }}
    />
  );
}