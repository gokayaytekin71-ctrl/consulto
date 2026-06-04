"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DecisionRow from "@/components/DecisionRow";

export default function SectionRow({
  id, title, subtitle, items = [], initialVisible = 6, perRow = 3, addRows = 2,
  isLoading = false, skeletonCount = 6, autoLoad = false, variant = "default",
}) {
  const total = items.length;
  const [visible, setVisible] = useState(Math.min(initialVisible, total));

  const canMore = visible < total;
  const canLess = visible > initialVisible;

  const isIbk = variant === "ibk";
  const step = Math.max(1, isIbk ? addRows : perRow * addRows);

  const renderItems = useMemo(() => items.slice(0, Math.min(visible, total)), [items, visible, total]);

  const handleMore = () => setVisible((v) => Math.min(total, v + step));

  const handleLess = () => {
    setVisible(initialVisible);
    const sectionElement = document.getElementById(id);
    if (sectionElement) sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!autoLoad || !canMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    let ticking = false;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !ticking) {
          ticking = true;
          setTimeout(() => { handleMore(); ticking = false; }, 80);
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [autoLoad, canMore, step]);

  const ibkHeadline = (ozet = "") => {
    const t = String(ozet || "").trim();
    if (!t) return "İçtihadı Birleştirme Kararı";
    return t.length > 130 ? t.slice(0, 128) + "…" : t;
  };

  return (
    <section
      id={id}
      aria-labelledby={`${id || "section"}-title`}
      className="scroll-mt-28"
      style={{
        background: "var(--surface, #fff)",
        border: "1px solid var(--line, #e3ddd0)",
        borderRadius: "4px",
        boxShadow: "0 1px 0 var(--line, #e3ddd0), 0 30px 60px -48px rgba(26,31,43,0.22)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* sol kenar renk şeridi — dergi hissi */}
      <span
        aria-hidden
        style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
          background: isIbk
            ? "linear-gradient(var(--navy, #0f2a4a), var(--amber, #b8860b))"
            : "linear-gradient(var(--amber, #b8860b), var(--navy, #0f2a4a))",
        }}
      />

      <div style={{ padding: "26px clamp(20px, 3vw, 34px)" }}>
        {/* Başlık */}
        <header
          style={{
            marginBottom: "22px",
            paddingBottom: "18px",
            borderBottom: "1px solid var(--line, #e3ddd0)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              display: "grid", placeItems: "center",
              width: "40px", height: "40px", borderRadius: "11px", flexShrink: 0,
              background: "rgba(184,134,11,0.08)",
              color: "var(--amber, #b8860b)",
              border: "1px solid rgba(184,134,11,0.22)",
            }}
          >
            {isIbk ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            )}
          </div>
          <div>
            <h2
              id={`${id || "section"}-title`}
              style={{
                fontFamily: "'Fraunces', serif",
                fontWeight: 600,
                fontSize: "1.32rem",
                letterSpacing: "-0.01em",
                color: "var(--navy, #0f2a4a)",
                lineHeight: 1.15,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  marginTop: "4px",
                  fontSize: "0.84rem",
                  color: "var(--ink-soft, #4a5160)",
                  fontFamily: "'Newsreader', Georgia, serif",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </header>

        {/* Satır listesi */}
        <div className="space-y-3">
          {renderItems.map((k) => {
            if (isIbk) {
              return (
                <DecisionRow
                  key={`ibk-${k.id}`}
                  externalHref={k.pdfHref || undefined}
                  type="İçtihadı Birleştirme"
                  code={[k.karar_code, k.birlesme_no].filter(Boolean).join(" · ")}
                  createdAt={k.created_at}
                  headline={ibkHeadline(k.ozet)}
                />
              );
            }
            return (
              <DecisionRow
                key={k.id}
                slug={k.fileName?.replace(/\.txt$/i, "") ?? k.id}
                type={k.type}
                code={k.code}
                createdAt={k.createdAt}
                aiSummary={k.aiSummary}
                keywords={k.keywords}
              />
            );
          })}

          {isLoading &&
            Array.from({ length: Math.max(0, skeletonCount - renderItems.length) }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="animate-pulse"
                style={{
                  borderRadius: "12px",
                  border: "1px solid var(--line, #e3ddd0)",
                  background: "var(--paper-2, #efebe1)",
                  padding: "18px 20px",
                }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-4 w-24 rounded" style={{ background: "var(--line-strong, #d3ccba)" }} />
                  <div className="h-3 w-20 rounded" style={{ background: "var(--line-strong, #d3ccba)" }} />
                </div>
                <div className="mb-2 h-3.5 w-3/4 rounded" style={{ background: "var(--line-strong, #d3ccba)" }} />
                <div className="mb-3 h-2.5 w-5/6 rounded" style={{ background: "var(--line-strong, #d3ccba)" }} />
                <div className="h-7 w-28 rounded-md" style={{ background: "var(--line-strong, #d3ccba)" }} />
              </div>
            ))}
        </div>

        {(canMore || canLess) && (
          <div
            style={{
              marginTop: "22px",
              paddingTop: "20px",
              borderTop: "1px solid var(--line, #e3ddd0)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            {canMore && (
              <button
                onClick={handleMore}
                className="group"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  borderRadius: "10px", border: "none", cursor: "pointer",
                  background: "var(--navy, #0f2a4a)", color: "#fff",
                  padding: "11px 26px",
                  fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                  boxShadow: "0 8px 22px -14px rgba(15,42,74,0.6)",
                  transition: "background .18s ease, transform .12s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--navy-2, #163a63)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--navy, #0f2a4a)")}
              >
                <span>Daha Fazla Göster</span>
                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
            )}
            {canLess && (
              <button
                onClick={handleLess}
                className="group"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  borderRadius: "10px", cursor: "pointer",
                  border: "1px solid var(--line-strong, #d3ccba)",
                  background: "var(--surface, #fff)", color: "var(--ink-soft, #4a5160)",
                  padding: "11px 22px",
                  fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                  transition: "color .18s ease, border-color .18s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--navy, #0f2a4a)"; e.currentTarget.style.borderColor = "var(--navy, #0f2a4a)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-soft, #4a5160)"; e.currentTarget.style.borderColor = "var(--line-strong, #d3ccba)"; }}
              >
                <span>Daha Az</span>
                <svg className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
              </button>
            )}
          </div>
        )}
      </div>
      {autoLoad && canMore && <div ref={sentinelRef} className="pointer-events-none h-10 w-full opacity-0" />}
    </section>
  );
}