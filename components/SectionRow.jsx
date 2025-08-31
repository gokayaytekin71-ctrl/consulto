// components/SectionRow.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DecisionCard from "@/components/DecisionCard";

/**
 * Bölüm listesi
 * — Ayrım net: kart bloğu çerçeveli arka plan içinde
 * — Başlangıçta 3 kart
 * — “Daha Fazla Göster” bölümün ALTINDA ve her tıklamada +6 kart
 * — Opsiyonel otomatik yükleme (IntersectionObserver)
 * — İsteğe bağlı skeleton kartları (isLoading)
 */
export default function SectionRow({
  id,
  title,
  subtitle,
  items = [],
  initialVisible = 3,   // başlangıç: 3 kart
  perRow = 3,           // grid kolon sayısı (lg)
  addRows = 2,          // her tıkta 2 satır => 2*3 = 6 kart
  isLoading = false,    // skeleton göstermek için
  skeletonCount = 6,    // isLoading=true iken kaç skeleton kart
  autoLoad = false,     // true ise alt sentinel görünce otomatik daha fazla
  variant = "default",  // YENİ: 'default' | 'ibk'
}) {
  const total = items.length;
  const [visible, setVisible] = useState(Math.min(initialVisible, total));
  const canMore = visible < total;

  const isIbk = variant === "ibk";
  const perRowEffective = isIbk ? 1 : perRow;

  // lg grid column sınıfını güvenli şekilde seç
  const lgColsClass = useMemo(() => {
    if (isIbk) return "lg:grid-cols-1";
    const map = {
      1: "lg:grid-cols-1",
      2: "lg:grid-cols-2",
      3: "lg:grid-cols-3",
      4: "lg:grid-cols-4",
    };
    return map[perRowEffective] || "lg:grid-cols-3";
  }, [perRowEffective, isIbk]);

  const renderItems = useMemo(
    () => items.slice(0, Math.min(visible, total)),
    [items, visible, total]
  );

  const handleMore = () => {
    // varsayılan: her tıkta 6 kart (perRow * addRows)
    setVisible((v) => Math.min(total, v + perRowEffective * addRows));
  };

  // Otomatik yükleme (opsiyonel)
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!autoLoad || !canMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    let ticking = false;
    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && !ticking) {
          ticking = true;
          setTimeout(() => {
            handleMore();
            ticking = false;
          }, 80);
        }
      },
      { rootMargin: "120px 0px 120px 0px" }
    );

    obs.observe(el);
    return () => {
      try { obs.disconnect(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, canMore, perRowEffective, addRows, total]);

  return (
    <section id={id} aria-labelledby={`${id || "section"}-title`} className="scroll-mt-24">
      <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-4 md:p-6 space-y-6">
        {/* Başlık Bloğu: ayrımı netleştir */}
        <header className="mb-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-300" />
            <h2 id={`${id || "section"}-title`} className="text-lg md:text-2xl font-bold text-blue-100">
              {title}
            </h2>
          </div>
          {subtitle && <p className="text-blue-300/80 text-sm">{subtitle}</p>}
        </header>

        {/* Status (erişilebilirlik) */}
        <div role="status" aria-live="polite" className="sr-only">
          {canMore
            ? `${Math.min(visible, total)} sonuç gösteriliyor, daha fazla mevcut.`
            : `${total} sonuç gösterildi.`}
        </div>

        {/* Grid */}
        <div className={isIbk ? "grid grid-cols-1 gap-6" : `grid grid-cols-1 md:grid-cols-2 ${lgColsClass} gap-6`}>
          {/* Normal kartlar */}
          {renderItems.map((k) => {
            if (isIbk) {
              const href = k?.pdfHref || null;
              const badgeClass =
                "inline-flex items-center rounded-full border border-blue-600/60 px-3 py-1 text-blue-100 font-semibold text-sm";
              const card = (
                <article
                  key={`ibk-${k.id}`}
                  className="rounded-xl border border-blue-700/50 bg-blue-900/20 p-4 hover:bg-blue-900/30 transition"
                >
                  <div className="flex items-center flex-wrap gap-3">
                    <span className={badgeClass}>{k.karar_code || "—/— Esas"}</span>
                    <span className={badgeClass}>{k.birlesme_no || "—/— Karar"}</span>
                  </div>
                  <p className="mt-3 text-[15px] leading-7 text-blue-100 text-justify">
                    <span className="font-semibold text-blue-200">Özet: </span>
                    {k.ozet || "Özet ekli değil."}
                  </p>
                </article>
              );
              return href ? (
                <a
                  key={`ibk-link-${k.id}`}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                >
                  {card}
                </a>
              ) : (
                card
              );
            }
            // Varsayılan karar kartı
            return (
              <DecisionCard
                key={k.id}
                id={k.fileName?.replace(/\.txt$/i, "") ?? k.id}
                type={k.type}
                code={k.code}
                aiSummary={k.aiSummary}
                keywords={k.keywords}
                contentLength={k.contentLength || 0}
              />
            );
          })}
          {/* Skeletonlar (isteğe bağlı) */}
          {isLoading &&
            Array.from({ length: Math.max(0, skeletonCount - renderItems.length) }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="bg-white/80 rounded-2xl border border-blue-800/30 p-4 animate-pulse"
              >
                <div className="h-5 w-2/3 bg-blue-200/60 rounded mb-3" />
                <div className="h-3 w-1/3 bg-blue-200/50 rounded mb-6" />
                <div className="h-4 w-full bg-blue-200/40 rounded mb-2" />
                <div className="h-4 w-5/6 bg-blue-200/40 rounded mb-2" />
                <div className="h-4 w-2/3 bg-blue-200/40 rounded mb-6" />
                <div className="h-9 w-full bg-blue-300/50 rounded" />
              </div>
            ))}
        </div>

        {/* Daha Fazla Göster: bölümün ALTINDA */}
        {canMore && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleMore}
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md border border-blue-600/60 text-blue-100 hover:bg-blue-700/30"
              aria-label="Daha fazla kart yükle"
            >
              Daha Fazla Göster
              <span className="text-blue-300"></span>
            </button>
          </div>
        )}
      </div>

      {/* Otomatik yükleme için görünmez sentinel */}
      {autoLoad && canMore && (
        <div ref={sentinelRef} className="h-3 w-full opacity-0 pointer-events-none" />
      )}
    </section>
  );
}