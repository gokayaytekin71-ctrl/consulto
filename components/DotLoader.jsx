"use client";
import React, { useEffect, useState } from "react";

const stages = [
  "Mevzuat taranıyor",
  "Kararlar taranıyor",
  "Emsal kararlar inceleniyor",
  "Analiz tamamlanıyor",
];

const dotColors = ["#FFA500", "#FFD700", "#FF69B4"]; // turuncu, sarı, pembe

export default function DotLoader() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % stages.length);
    }, 10000); // 10 saniyede bir değiş
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <h2 className="text-white text-[14px] font-medium">{stages[stageIndex]}</h2>
      <div className="flex items-center gap-1 min-h-[20px]">
        {dotColors.map((color, index) => (
          <span
            key={index}
            className="w-[18px] h-[18px] rounded-full"
            style={{
              backgroundColor: color,
              animation: `opacityBounce 2.2s ease-in-out ${index * 0.3}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}