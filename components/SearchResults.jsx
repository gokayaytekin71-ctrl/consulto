"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

// --- İKONLAR (Görsel Zenginlik İçin) ---
const IconSort = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18" /><path d="M7 12h10" /><path d="M10 18h4" />
  </svg>
);

const IconSparkles = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

// HTML escape
const esc = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

// <mark> ile vurgulama (regex güvenli)
const highlight = (text = "", term = "") => {
  if (!term) return esc(text);
  const safe = esc(text);
  const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")})`, "gi");
  return safe.replace(re, "<mark>$1</mark>");
};

const makeSlug = (it) => it.fileName?.replace(/\.txt$/i, "") ?? it.id;

// --- Tekilleştirme yardımcıları ---
const norm = (s = "") => s.replace(/\s+/g, " ").trim().toLowerCase();

const dedupeRows = (rows = []) => {
  const map = new Map();
  for (const r of rows) {
    const typeNorm = norm(r.type || "");
    const codeNorm = norm(r.code || "");
    let key = codeNorm ? `cc:${typeNorm}__${codeNorm}` : null;

    if (!key) {
      const slug = (r.fileName || "")
        .replace(/\.txt$/i, "")
        .toLowerCase()
        .replace(/[_-]p?\d+$/i, "");
      key = slug ? `slug:${slug}` : `id:${r.id}`;
    }
    if (!map.has(key)) map.set(key, r);
  }
  return Array.from(map.values());
};

// AI Özeti stil düzenleyici (Yeni tema renklerine uygun)
const formatAiSummary = (text = "") => {
  let s = esc(text);
  s = s.replace(/(^|\n)\s*Uyuşmazlık:/gi, (_m, p1) => {
    const prefix = p1 || "";
    return `${prefix}<span class="text-indigo-300 font-bold tracking-wide uppercase text-xs">Uyuşmazlık:</span>`;
  });
  s = s.replace(/(^|\n)\s*Gerekçe(?:\s*ve\s*Sonuç)?\s*:/gi, (_m, p1) => {
    const lead = p1 ? "<br/><br/>" : "";
    return `${lead}<span class="text-cyan-300 font-bold tracking-wide uppercase text-xs">Gerekçe ve Sonuç:</span>`;
  });
  s = s.replace(/\n/g, "<br/>");
  return s;
};

export default function SearchResults({
  items = [],
  query = "",
  field = "content", 
  initialNextCursor,
}) {
  const [results, setResults] = useState(() => dedupeRows(items));
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [snips, setSnips] = useState({});
  const [openSummary, setOpenSummary] = useState({ id: null, dir: "up" });
  const [isNavigating, setIsNavigating] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams?.get("sort") || "relevance";
  const fieldBadge = field === "keywords" ? "Anahtar Kelimeler" : field === "aiSummary" ? "Karar Özeti" : null;

  const computePopoverDir = (btnEl) => {
    if (!btnEl) return "down";
    const rect = btnEl.getBoundingClientRect();
    const HEADER_EST = 96; 
    const POPOVER_EST = 260; 
    const MARGIN = 8;
    const spaceAbove = rect.top - HEADER_EST;
    const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
    if (spaceAbove < POPOVER_EST && spaceBelow >= spaceAbove) return "down";
    if (spaceBelow < POPOVER_EST && spaceAbove >= spaceBelow) return "up";
    return spaceBelow >= spaceAbove ? "down" : "up";
  };

  useEffect(() => {
    setResults(dedupeRows(items));
    setNextCursor(initialNextCursor);
    setSnips({});
    setLoadError("");
    setIsNavigating(false);
  }, [items, initialNextCursor, query, field]);

  useEffect(() => {
    const close = () => setOpenSummary({ id: null, dir: "up" });
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close, { passive: true });
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, []);

  const baseParams = useMemo(() => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    sp.delete("cursor");
    return sp;
  }, [searchParams]);

  const fetchSnippetsFor = async (rows) => {
    if (!rows?.length || !query) return;
    const ids = rows.map((r) => r.id);
    let aborted = false;

    try {
      const r = await fetch("/api/kararlar/snippet-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, field, term: query }),
      });
      const j = await r.json();
      if (!aborted) setSnips((prev) => ({ ...prev, ...(j?.snippets || {}) }));
    } catch {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const u = `/api/kararlar/snippet?id=${encodeURIComponent(id)}&field=${encodeURIComponent(field)}&term=${encodeURIComponent(query)}`;
            const r = await fetch(u);
            const j = await r.json();
            return [id, j?.snippet || ""];
          } catch {
            return [id, ""];
          }
        })
      );
      if (!aborted) setSnips((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    }
    return () => { aborted = true; };
  };

  useEffect(() => {
    let stop = () => {};
    (async () => { stop = await fetchSnippetsFor(results); })();
    return () => { try { stop(); } catch {} };
  }, [results, query, field]);

  const handleLoadMore = async () => {
    if (!nextCursor || isMoreLoading) return;
    setIsMoreLoading(true);
    setLoadError("");
    try {
      const sp = new URLSearchParams(baseParams.toString());
      sp.set("cursor", nextCursor);
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(`/api/kararlar?${sp.toString()}`, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const j = await res.json();
      const newRows = Array.isArray(j?.data) ? j.data : [];
      setResults((prev) => dedupeRows([...prev, ...newRows]));
      setNextCursor(j?.nextCursor);
      if (newRows.length && query) await fetchSnippetsFor(newRows);
    } catch (e) {
      console.error("Load more error:", e);
      setLoadError("Daha fazla sonuç alınamadı. Tekrar deneyin.");
    } finally {
      setIsMoreLoading(false);
    }
  };

  if (!results.length) {
    return (
      <>
        {(isNavigating || isMoreLoading) && <LoadingOverlay />}
        <section id="search" className="space-y-6">
           <div className="rounded-xl border border-white/5 bg-slate-900/50 p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                 <IconSort className="w-6 h-6 opacity-50" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">Sonuç Bulunamadı</h3>
              <p className="text-sm text-slate-500 mt-1">Lütfen arama kriterlerinizi değiştirip tekrar deneyin.</p>
           </div>
        </section>
      </>
    );
  }

  return (
    <>
      {(isNavigating || isMoreLoading) && <LoadingOverlay />}
      <section id="search" className="space-y-6">
        
        {/* --- Header & Sort Control --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                <h2 className="text-xl font-bold text-white tracking-tight">Arama Sonuçları</h2>
            </div>
            
            {query && (
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="text-slate-400">Aranan:</span>
                <span className="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded border border-white/10">“{query}”</span>
                {fieldBadge && (
                  <span className="ml-1 inline-flex items-center rounded bg-cyan-900/30 text-cyan-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-cyan-700/50">
                    {fieldBadge}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Sort Dropdown (Custom styled) */}
          <div className="shrink-0 relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
               <IconSort className="w-4 h-4" />
            </div>
            <select
              id="sortSelect"
              className="appearance-none pl-9 pr-8 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-white/20 hover:bg-slate-800 transition-colors cursor-pointer"
              value={currentSort}
              onChange={(e) => {
                setIsNavigating(true);
                const sp = new URLSearchParams(searchParams.toString());
                sp.set("sort", e.target.value || "relevance");
                sp.delete("cursor");
                router.push(`/kararlar?${sp.toString()}`);
              }}
            >
              <option value="relevance">En Alakalı</option>
              <option value="esasNoAsc">Esas No (Artan)</option>
              <option value="esasNoDesc">Esas No (Azalan)</option>
              <option value="kararNoAsc">Karar No (Artan)</option>
              <option value="kararNoDesc">Karar No (Azalan)</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* --- Results List --- */}
        <ul className="space-y-4">
          {results.map((it) => {
            const slug = makeSlug(it);
            const raw = snips[it.id] || "";
            const kwList = typeof it.keywords === "string"
              ? it.keywords.split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 8)
              : [];

            return (
              <li 
                key={it.id} 
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-cyan-900/10"
              >
                {/* Hover Gradient Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-indigo-500/0 opacity-0 transition-opacity duration-500 group-hover:from-cyan-500/5 group-hover:to-indigo-500/10 group-hover:opacity-100 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-4">
                  
                  {/* Left: Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                        <Link
                          href={`/kararlar/${slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/link focus:outline-none"
                        >
                          <h3 className="text-lg font-bold text-slate-100 transition-colors group-hover/link:text-cyan-400 leading-snug">
                            {it.type?.trim()?.startsWith("Yargıtay") ? it.type : `Yargıtay ${it.type || ""}`}
                          </h3>
                        </Link>
                        
                        {/* Mobile AI Button (Visible on small screens) */}
                        <div className="md:hidden">
                           {/* (Same logic as desktop button below) */}
                        </div>
                    </div>

                    {/* Code Badge */}
                    <Link
                      href={`/kararlar/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs font-mono text-slate-400 group-hover:text-cyan-200 group-hover:border-cyan-500/40 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-cyan-400 transition-colors"></span>
                        {it.code}
                      </span>
                    </Link>

                    {/* Keywords */}
                    {kwList.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {kwList.map((k, i) => (
                          <Link
                            key={`${it.id}-kw-${i}`}
                            href={`/kararlar?kw=${encodeURIComponent(k)}&sort=${encodeURIComponent(currentSort)}`}
                            onClick={() => setIsNavigating(true)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/50 hover:border-cyan-500/50 hover:text-cyan-300 hover:bg-slate-800/80 transition-all"
                          >
                            {k}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Snippet (Highlight) */}
                    {query && raw && (
                      <Link
                        href={`/kararlar/${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-3 group/snippet"
                      >
                         <div className="relative pl-3 border-l-2 border-slate-700 group-hover/snippet:border-cyan-500/50 transition-colors">
                            <p
                              className="text-sm text-slate-400 leading-relaxed line-clamp-3 group-hover/snippet:text-slate-300 [&_mark]:bg-amber-500/20 [&_mark]:text-amber-200 [&_mark]:px-0.5 [&_mark]:rounded-sm [&_mark]:font-medium"
                              dangerouslySetInnerHTML={{ __html: `… ${highlight(raw, query)} …` }}
                            />
                         </div>
                      </Link>
                    )}
                  </div>

                  {/* Right: AI Actions */}
                  <div 
                    className="shrink-0 relative mt-2 md:mt-0"
                    onMouseLeave={() => setOpenSummary((cur) => (cur.id === it.id ? { id: null, dir: "up" } : cur))}
                  >
                    <button
                      type="button"
                      onMouseEnter={(e) => { const dir = computePopoverDir(e.currentTarget); setOpenSummary({ id: it.id, dir }); }}
                      onFocus={(e) => { const dir = computePopoverDir(e.currentTarget); setOpenSummary({ id: it.id, dir }); }}
                      onClick={(e) => { const dir = computePopoverDir(e.currentTarget); setOpenSummary((cur) => (cur.id === it.id ? { id: null, dir } : { id: it.id, dir })); }}
                      className="group/ai flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-300 transition-all hover:bg-indigo-500/20 hover:text-indigo-200 hover:shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:border-indigo-500/50"
                      aria-expanded={openSummary.id === it.id}
                    >
                      <IconSparkles className="w-3.5 h-3.5" />
                      <span>AI Özeti</span>
                    </button>

                    {/* Popover */}
                    <div
                      id={`ai-popover-${it.id}`}
                      className={`
                        ${openSummary.id === it.id ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"} 
                        absolute right-0 w-[22rem] md:w-[32rem] max-w-[90vw] z-50 transition-all duration-200 origin-top-right
                        ${openSummary.dir === "up" ? "bottom-full mb-3" : "top-full mt-3"}
                      `}
                    >
                      <div className="rounded-xl bg-[#0f172a] border border-slate-700/80 p-4 shadow-2xl shadow-black ring-1 ring-white/10">
                        <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                           <IconSparkles className="w-4 h-4 text-indigo-400" />
                           <span className="text-xs font-bold text-white uppercase tracking-wider">Yapay Zeka Analizi</span>
                        </div>
                        <div
                          className="text-slate-300 text-sm max-h-60 overflow-y-auto custom-scrollbar leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatAiSummary(it.aiSummary || "Özet bulunamadı.") }}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </li>
            );
          })}
        </ul>

        {/* Load More Button */}
        <div className="pt-6 pb-2 text-center">
          {loadError && <p className="text-sm text-rose-400 mb-4 bg-rose-900/20 inline-block px-3 py-1 rounded border border-rose-800">{loadError}</p>}

          {nextCursor && (
            <button
              onClick={handleLoadMore}
              disabled={isMoreLoading}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-slate-800 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-slate-700 hover:shadow-cyan-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-white/5"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 opacity-0 transition-opacity group-hover:opacity-100" />
              {isMoreLoading ? (
                 <>
                   <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   <span className="relative z-10">Yükleniyor...</span>
                 </>
              ) : (
                 <>
                   <span className="relative z-10">Daha Fazla Sonuç</span>
                   <svg className="relative z-10 h-4 w-4 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                   </svg>
                 </>
              )}
            </button>
          )}
        </div>
      </section>
    </>
  );
}