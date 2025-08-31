"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

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

// Kararları tekilleştir: öncelik TYPE+CODE (aynı esas/karar no), sonra slug fallback
const dedupeRows = (rows = []) => {
  const map = new Map();
  for (const r of rows) {
    const typeNorm = norm(r.type || "");
    const codeNorm = norm(r.code || "");

    // Birçok duplikasyon, aynı kararın farklı dosya kayıtlarından geliyor;
    // esas/karar kodu aynıdır. Bu yüzden önce code+type ile tekilleştir.
    let key = codeNorm ? `cc:${typeNorm}__${codeNorm}` : null;

    if (!key) {
      // Code yoksa dosya adına (slug) düş. Sona eklenmiş parçaları (_p12 vb.) sil.
      const slug = (r.fileName || "")
        .replace(/\.txt$/i, "")
        .toLowerCase()
        .replace(/[_-]p?\d+$/i, "");
      key = slug ? `slug:${slug}` : `id:${r.id}`;
    }

    if (!map.has(key)) map.set(key, r); // ilk görüleni tut
  }
  return Array.from(map.values());
};

// AI Özeti içinde başlıkları renklendir
const formatAiSummary = (text = "") => {
  let s = esc(text);
  // başlıklar
  s = s.replace(/(^|\n)\s*Uyuşmazlık:/gi, (_m, p1) => {
    const prefix = p1 || "";
    return `${prefix}<span class="text-blue-300 font-semibold">Uyuşmazlık:</span>`;
  });
  s = s.replace(/(^|\n)\s*Gerekçe(?:\s*ve\s*Sonuç)?\s*:/gi, (_m, p1) => {
    const lead = p1 ? "<br/><br/>" : "";
    return `${lead}<span class="text-cyan-300 font-semibold">Gerekçe ve Sonuç:</span>`;
  });
  // satır sonlarını koru
  s = s.replace(/\n/g, "<br/>");
  return s;
};

export default function SearchResults({
  items = [],
  query = "",
  field = "content", // "content" | "aiSummary" | "keywords"
  initialNextCursor,
}) {
  const [results, setResults] = useState(() => dedupeRows(items));
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [snips, setSnips] = useState({}); // id -> snippet string
  const [openSummary, setOpenSummary] = useState({ id: null, dir: "up" });
  const [isNavigating, setIsNavigating] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams?.get("sort") || "relevance"; // Varsayılan: Alaka
  const fieldBadge = field === "keywords" ? "Anahtar Kelimeler" : field === "aiSummary" ? "Karar Özeti" : null;

  // Popover yönünü butonun ekran konumuna göre belirle (header ve tahmini popover yüksekliği hesaba katılır)
  const computePopoverDir = (btnEl) => {
    if (!btnEl) return "down";
    const rect = btnEl.getBoundingClientRect();
    const HEADER_EST = 96;     // sabit header yüksekliği tahmini
    const POPOVER_EST = 260;   // popover max içerik + padding tahmini
    const MARGIN = 8;

    const spaceAbove = rect.top - HEADER_EST;
    const spaceBelow = window.innerHeight - rect.bottom - MARGIN;

    // Yeterli alan yoksa daha geniş tarafa aç
    if (spaceAbove < POPOVER_EST && spaceBelow >= spaceAbove) return "down";
    if (spaceBelow < POPOVER_EST && spaceAbove >= spaceBelow) return "up";

    // Eşit/benzer durumlarda aşağıyı tercih et (header çakışmasın)
    return spaceBelow >= spaceAbove ? "down" : "up";
  };

  // Props değişince senkronize et
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

  // Mevcut URL paramlarını (cursor hariç) koru
  const baseParams = useMemo(() => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    sp.delete("cursor");
    return sp;
  }, [searchParams]);

  // Snippet fetch: batch dene, 404/hata olursa tekil route'a düş
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
      if (!aborted) {
        setSnips((prev) => ({ ...prev, ...(j?.snippets || {}) }));
      }
    } catch {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const u = `/api/kararlar/snippet?id=${encodeURIComponent(id)}&field=${encodeURIComponent(
              field
            )}&term=${encodeURIComponent(query)}`;
            const r = await fetch(u);
            const j = await r.json();
            return [id, j?.snippet || ""];
          } catch {
            return [id, ""];
          }
        })
      );
      if (!aborted) {
        setSnips((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      }
    }

    return () => {
      aborted = true;
    };
  };

  // İlk batch snippet
  useEffect(() => {
    let stop = () => {};
    (async () => {
      stop = await fetchSnippetsFor(results);
    })();
    return () => {
      try { stop(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Yeni gelenler için snippet (sadece query doluysa)
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
        <section id="search" className="space-y-4">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-blue-100">Arama Sonuçları</h2>
              {query && (
                <p className="text-blue-300/80 text-sm mt-1 flex items-center gap-2">
                  <span className="font-semibold text-blue-100">“{query}”</span>
                  {fieldBadge && (
                    <span className="inline-flex items-center rounded-full bg-sky-900/50 text-sky-300 px-2 py-0.5 text-[11px] border border-sky-700/60">
                      {fieldBadge}
                    </span>
                  )}
                </p>
              )}
            </div>
            {/* Sırala */}
            <div className="shrink-0">
              <label className="sr-only" htmlFor="sortSelect">Sırala</label>
              <select
                id="sortSelect"
                className="px-3 py-1.5 rounded-md border border-blue-600/60 bg-blue-900/30 text-blue-100"
                value={currentSort}
                onChange={(e) => {
                  setIsNavigating(true);
                  const sp = new URLSearchParams(searchParams.toString());
                  sp.set("sort", e.target.value || "relevance");
                  sp.delete("cursor"); // sayfalama reset
                  router.push(`/kararlar?${sp.toString()}`);
                }}
              >
                <option value="relevance">Alakaya Göre</option>
                <option value="esasNoAsc">Esas No (Artan)</option>
                <option value="esasNoDesc">Esas No (Azalan)</option>
                <option value="kararNoAsc">Karar No (Artan)</option>
                <option value="kararNoDesc">Karar No (Azalan)</option>
              </select>
            </div>
          </div>
          <p className="text-blue-300/80 text-sm">Sonuç bulunamadı.</p>
        </section>
      </>
    );
  }

  return (
    <>
      {(isNavigating || isMoreLoading) && <LoadingOverlay />}
      <section id="search" className="space-y-4">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-blue-100">Arama Sonuçları</h2>
            {query && (
              <p className="text-blue-300/80 text-sm mt-1 flex items-center gap-2">
                <span className="font-semibold text-blue-100">“{query}”</span>
                {fieldBadge && (
                  <span className="inline-flex items-center rounded-full bg-sky-900/50 text-sky-300 px-2 py-0.5 text-[11px] border border-sky-700/60">
                    {fieldBadge}
                  </span>
                )}
              </p>
            )}
          </div>
          {/* Sırala */}
          <div className="shrink-0">
            <label className="sr-only" htmlFor="sortSelect">Sırala</label>
            <select
              id="sortSelect"
              className="px-3 py-1.5 rounded-md border border-blue-600/60 bg-blue-900/30 text-blue-100"
              value={currentSort}
              onChange={(e) => {
                setIsNavigating(true);
                const sp = new URLSearchParams(searchParams.toString());
                sp.set("sort", e.target.value || "relevance");
                sp.delete("cursor"); // sayfalama reset
                router.push(`/kararlar?${sp.toString()}`);
              }}
            >
              <option value="relevance">Alakaya Göre</option>
              <option value="esasNoAsc">Esas No (Artan)</option>
              <option value="esasNoDesc">Esas No (Azalan)</option>
              <option value="kararNoAsc">Karar No (Artan)</option>
              <option value="kararNoDesc">Karar No (Azalan)</option>
            </select>
          </div>
        </div>

        <ul className="space-y-4">
          {results.map((it) => {
            const slug = makeSlug(it);
            const raw = snips[it.id] || "";
            const kwList =
              typeof it.keywords === "string"
                ? it.keywords.split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 8)
                : [];

            return (
              <li key={it.id} className="relative bg-blue-900/25 border border-blue-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Başlık + kod tıklanabilir */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/kararlar/${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        title="Karar detayını aç (yeni sekme)"
                      >
                        <h3 className="text-blue-100 font-semibold truncate transition-colors group-hover:text-sky-300 active:opacity-90">
                          {it.type?.trim()?.startsWith("Yargıtay") ? it.type : `Yargıtay ${it.type || ""}`}
                        </h3>
                      </Link>
                      {/* Etiketler (başlığın yanında) */}
                      {kwList.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {kwList.map((k, i) => (
                            <Link
                              key={`${it.id}-kw-${i}`}
                              href={`/kararlar?kw=${encodeURIComponent(k)}&sort=${encodeURIComponent(currentSort)}`}
                              title="Bu etikete tıklayınca yalnızca anahtar kelimelerde arama yapılır"
                              onClick={() => setIsNavigating(true)}
                              className="bg-sky-900/50 text-sky-300 px-2 py-0.5 rounded-full text-[11px] hover:bg-sky-800/60"
                            >
                              {k}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/kararlar/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      title="Karar detayını aç (yeni sekme)"
                    >
                      <p className="text-blue-300/80 text-sm">{it.code}</p>
                    </Link>
                  </div>

                  {/* AI Özeti hover */}
                  <div
                    className="relative"
                    onMouseLeave={() => setOpenSummary((cur) => (cur.id === it.id ? { id: null, dir: "up" } : cur))}
                  >
                    <button
                      className="text-xs px-3 py-1.5 rounded-md border border-blue-600/60 text-blue-100 hover:bg-blue-700/30"
                      type="button"
                      onMouseEnter={(e) => {
                        const dir = computePopoverDir(e.currentTarget);
                        setOpenSummary({ id: it.id, dir });
                      }}
                      onFocus={(e) => {
                        const dir = computePopoverDir(e.currentTarget);
                        setOpenSummary({ id: it.id, dir });
                      }}
                      onClick={(e) => {
                        const dir = computePopoverDir(e.currentTarget);
                        setOpenSummary((cur) => (cur.id === it.id ? { id: null, dir } : { id: it.id, dir }));
                      }}
                      aria-expanded={openSummary.id === it.id}
                      aria-controls={`ai-popover-${it.id}`}
                    >
                      AI Özeti
                    </button>
                    <div
                      id={`ai-popover-${it.id}`}
                      className={`${openSummary.id === it.id ? "block" : "hidden"} absolute right-0 ${openSummary.dir === "up" ? "bottom-full mb-2" : "top-full mt-2"} w-[34rem] max-w-[90vw] bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl z-50`}
                      role="dialog"
                      aria-label="AI özeti"
                    >
                      <div
                        className="text-slate-200 text-sm max-h-56 overflow-auto leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatAiSummary(it.aiSummary || "Özet bulunamadı.") }}
                      />
                    </div>
                  </div>
                </div>

                {/* Vurgulu snippet (yalnızca query varsa) */}
                {query && raw ? (
                  <Link
                    href={`/kararlar/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    title="Karar metnini aç (yeni sekme)"
                  >
                    <p
                      className="text-blue-100 text-[15px] leading-relaxed line-clamp-3 transition-colors hover:text-blue-300 active:opacity-90"
                      style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                      dangerouslySetInnerHTML={{ __html: `… ${highlight(raw, query)} …` }}
                    />
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>

        {loadError && <p className="text-sm text-red-300">{loadError}</p>}

        {nextCursor && (
          <div className="text-center my-6">
            <button
              onClick={handleLoadMore}
              disabled={isMoreLoading}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-600"
            >
              {isMoreLoading ? "Yükleniyor…" : "Daha Fazla Yükle"}
            </button>
          </div>
        )}
      </section>
    </>
  );
}