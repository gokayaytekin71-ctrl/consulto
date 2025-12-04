"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

// --- İKONLAR ---
const IconSort = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} viewBox="0 0 24 24">
    <path d="M3 6h18" /><path d="M7 12h10" /><path d="M10 18h4" />
  </svg>
);

const IconSparkles = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} viewBox="0 0 24 24">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

const esc = (s = "") => String(s)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const highlight = (text = "", term = "") => {
  if (!term) return esc(text);
  const safe = esc(text);
  const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return safe.replace(re, "<mark>$1</mark>");
};

const makeSlug = (it) => it.fileName?.replace(/\.txt$/i, "") ?? it.id;

const norm = (s = "") => s.replace(/\s+/g, " ").trim().toLowerCase();

const dedupeRows = (rows = []) => {
  const map = new Map();
  for (const r of rows) {
    const typeNorm = norm(r.type || "");
    const codeNorm = norm(r.code || "");
    let key = codeNorm ? `cc:${typeNorm}__${codeNorm}` : null;
    if (!key) {
      const slug = (r.fileName || "").replace(/\.txt$/i, "").toLowerCase().replace(/[_-]p?\d+$/i, "");
      key = slug ? `slug:${slug}` : `id:${r.id}`;
    }
    if (!map.has(key)) map.set(key, r);
  }
  return Array.from(map.values());
};

const formatAiSummary = (text = "") => {
  let s = esc(text);
  s = s.replace(/(^|\n)\s*Uyuşmazlık:/gi, (_m, p1) =>
    `${p1 || ""}<span class="text-indigo-300 font-bold tracking-wide uppercase text-xs">Uyuşmazlık:</span>`);
  s = s.replace(/(^|\n)\s*Gerekçe(?:\s*ve\s*Sonuç)?\s*:/gi, (_m, p1) =>
    `${p1 ? "<br/><br/>" : ""}<span class="text-cyan-300 font-bold tracking-wide uppercase text-xs">Gerekçe ve Sonuç:</span>`);
  s = s.replace(/\n/g, "<br/>");
  return s;
};

export default function SearchResults({ items = [], query = "", field = "content", initialNextCursor }) {
  const [results, setResults] = useState(() => dedupeRows(items));
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [snips, setSnips] = useState({});
  const [openSummary, setOpenSummary] = useState({ id: null });
  const [isNavigating, setIsNavigating] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams?.get("sort") || "relevance";
  const fieldBadge = field === "keywords" ? "Anahtar Kelimeler" : field === "aiSummary" ? "Karar Özeti" : null;

  const baseParams = useMemo(() => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    sp.delete("cursor");
    return sp;
  }, [searchParams]);

  useEffect(() => {
    setResults(dedupeRows(items));
    setNextCursor(initialNextCursor);
    setSnips({});
    setLoadError("");
    setIsNavigating(false);
  }, [items, initialNextCursor, query, field]);

  const fetchSnippetsFor = async (rows) => {
    if (!rows?.length || !query) return;
    const ids = rows.map((r) => r.id);
    try {
      const r = await fetch("/api/kararlar/snippet-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, field, term: query }),
      });
      const j = await r.json();
      setSnips((prev) => ({ ...prev, ...(j?.snippets || {}) }));
    } catch {
      const entries = await Promise.all(ids.map(async (id) => {
        try {
          const r = await fetch(`/api/kararlar/snippet?id=${id}&field=${field}&term=${query}`);
          const j = await r.json();
          return [id, j?.snippet || ""];
        } catch {
          return [id, ""];
        }
      }));
      setSnips((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    }
  };

  useEffect(() => {
    fetchSnippetsFor(results);
  }, [results, query, field]);

  const handleLoadMore = async () => {
    if (!nextCursor || isMoreLoading) return;
    setIsMoreLoading(true);
    setLoadError("");
    try {
      const sp = new URLSearchParams(baseParams.toString());
      sp.set("cursor", nextCursor);
      const res = await fetch(`/api/kararlar?${sp.toString()}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const j = await res.json();
      const newRows = Array.isArray(j?.data) ? j.data : [];
      setResults((prev) => dedupeRows([...prev, ...newRows]));
      setNextCursor(j?.nextCursor);
      if (newRows.length && query) await fetchSnippetsFor(newRows);
    } catch (e) {
      setLoadError("Daha fazla sonuç alınamadı.");
    } finally {
      setIsMoreLoading(false);
    }
  };

  if (!results.length) {
    return (
      <section className="text-center p-6">
        <p className="text-white font-semibold">Sonuç bulunamadı</p>
      </section>
    );
  }

  return (
    <>
      {(isNavigating || isMoreLoading) && <LoadingOverlay />}
      <section className="space-y-6">
        <ul className="space-y-4">
          {results.map((it) => {
            const slug = makeSlug(it);
            const snippet = snips[it.id] || "";
            const kwList = (it.keywords || "").split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 8);

            return (
              <li key={it.id} className="relative group rounded-xl border border-white/10 p-6 bg-white/5 hover:bg-white/10 transition-all">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Link href={`/kararlar/${slug}`} target="_blank">
                      <h3 className="text-white font-bold text-lg hover:text-cyan-400 transition">{it.type}</h3>
                    </Link>
                    <p className="text-slate-400 text-xs">{it.code}</p>
                    {kwList.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {kwList.map((k, i) => (
                          <span key={i} className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">{k}</span>
                        ))}
                      </div>
                    )}
                    {query && snippet && (
                      <div className="text-sm text-slate-400 mt-2" dangerouslySetInnerHTML={{ __html: `… ${highlight(snippet, query)} …` }} />
                    )}
                  </div>
                  <div>
                    <button
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-2 rounded shadow"
                      onClick={() =>
                        setOpenSummary((cur) =>
                          cur.id === it.id ? { id: null } : { id: it.id }
                        )
                      }
                    >
                      <IconSparkles className="w-4 h-4 inline mr-1" />
                      AI Özeti
                    </button>
                  </div>
                </div>

                {/* AI Özeti Popover */}
                {openSummary.id === it.id && (
                  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setOpenSummary({ id: null })}>
                    <div className="bg-[#0f172a] border border-slate-700 p-6 rounded-xl max-w-2xl w-[90vw] text-sm text-slate-300 overflow-y-auto max-h-[70vh]" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-indigo-400 text-xs">Yapay Zeka Özeti</span>
                        <button onClick={() => setOpenSummary({ id: null })} className="text-slate-400 hover:text-white text-xs">Kapat</button>
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: formatAiSummary(it.aiSummary || "Özet bulunamadı.") }} />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {nextCursor && (
          <div className="text-center pt-6">
            <button
              onClick={handleLoadMore}
              className="px-6 py-3 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50"
              disabled={isMoreLoading}
            >
              {isMoreLoading ? "Yükleniyor..." : "Daha Fazla Sonuç"}
            </button>
          </div>
        )}
      </section>
    </>
  );
}