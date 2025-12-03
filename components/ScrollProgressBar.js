// components/ScrollProgressBar.js
"use client";

import { useEffect, useState } from "react";

export default function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = totalScroll / windowHeight;
      setScrollProgress(Number.isNaN(scroll) ? 0 : scroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 z-[100] print:hidden transition-all duration-100 ease-out shadow-[0_0_10px_rgba(56,189,248,0.5)]"
      style={{ width: `${scrollProgress * 100}%` }}
    />
  );
}