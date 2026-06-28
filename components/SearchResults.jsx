"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";
import DecisionRow from "@/components/DecisionRow";

const IconSort = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} viewBox="0 0 24 24">
    <path d="M3 6h18" /><path d="M7 12h10" /><path d="M10 18h4" />
  </svg>
);

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

export default function SearchResults({ items = [], query = "", field = "content", initialNextCursor }) {
  const [results, setResults] = useState(() => dedupeRows(items));
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [snips, setSnips] = useState({});
  const [isNavigating, setIsNavigating] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams?.get("sort") || "relevance";

  const handleSortChange = (e) => {
    const value = e.target.value;
    const sp = new URLSearchParams(searchParams?.toString() || "");
    if (value && value !== "relevance") {
      sp.set("sort", value);
    } else {
      sp.delete("sort");
    }
    sp.delete("cursor");
    setIsNavigating(true);
    router.push(`/kararlar?${sp.toString()}`);
  };

  const fieldBadge = field === "keywords" ? "Anahtar Kelimeler" : field === "aiSummary" ? "Karar Özeti" : null;

  const baseParams = useMemo(() => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    sp.delete("cursor");
    return sp;
  }, [searchParams]);

  // Yeni arama / sıralama -> state'i sıfırla
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
          const r = await fetch(`/api/kararlar/snippet?id=${id}&field=${field}&term=${encodeURIComponent(query)}`);
          const j = await r.json();
          return [id, j?.snippet || ""];
        } catch {
          return [id, ""];
        }
      }));
      setSnips((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    }
  };

  // Snippet'i SADECE henüz çekilmemiş satırlar için getir.
  // Böylece load-more sonrası tüm liste yeniden çekilmez (çift istek/flicker yok).
  useEffect(() => {
    if (!query) return;
    const missing = results.filter((r) => snips[r.id] === undefined);
    if (missing.length) fetchSnippetsFor(missing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, query, field, snips]);

  const handleLoadMore = async () => {
    if (!nextCursor || isMoreLoading) return;
    setIsMoreLoading(true);
    setLoadError("");
    try {
      const sp = new URLSearchParams(baseParams.toString());
      sp.set("cursor", nextCursor);
      const res = await fetch(`/api/kararlar/search?${sp.toString()}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const j = await res.json();
      const newRows = Array.isArray(j?.data) ? j.data : [];

      // Hiç yeni satır gelmediyse (ör. hepsi tekrar/dedupe) butonu kapat
      if (!newRows.length) {
        setNextCursor(undefined);
        return;
      }

      setResults((prev) => dedupeRows([...prev, ...newRows]));
      setNextCursor(j?.nextCursor);
      // snippet'ler yukarıdaki effect tarafından otomatik çekilir
    } catch (e) {
      setLoadError("Daha fazla sonuç alınamadı.");
    } finally {
      setIsMoreLoading(false);
    }
  };

  if (!results.length) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-semibold text-[#0f2a4a]">Sonuç bulunamadı</p>
        <p className="mt-1 text-sm text-slate-500">Farklı bir arama terimi veya filtre deneyin.</p>
      </section>
    );
  }

  return (
    <>
      {(isNavigating || isMoreLoading) && <LoadingOverlay />}
      <section className="space-y-4">
        {/* Üst bar: alan rozeti + sıralama */}
        <div className="flex items-center justify-between gap-3">
          {fieldBadge ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-[#0f2a4a]">
              Alan: {fieldBadge}
            </span>
          ) : (
            <span className="text-[13px] text-slate-500">{results.length} sonuç</span>
          )}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <IconSort className="h-4 w-4 text-slate-400" />
            <select
              value={currentSort}
              onChange={handleSortChange}
              className="bg-transparent text-xs text-slate-700 focus:outline-none"
            >
              <option value="relevance">İlgililik</option>
              <option value="newest">En Yeni</option>
              <option value="esasNoDesc">Esas (Yeni → Eski)</option>
              <option value="esasNoAsc">Esas (Eski → Yeni)</option>
              <option value="kararNoDesc">Karar (Yeni → Eski)</option>
              <option value="kararNoAsc">Karar (Eski → Yeni)</option>
            </select>
          </div>
        </div>

        <ul className="space-y-3">
          {results.map((it) => (
            <li key={it.id}>
              <DecisionRow
                slug={makeSlug(it)}
                type={it.type}
                code={it.code}
                createdAt={it.createdAt}
                aiSummary={it.aiSummary}
                keywords={it.keywords}
                snippet={snips[it.id] || ""}
                query={query}
              />
            </li>
          ))}
        </ul>

        {loadError && <p className="text-center text-sm text-rose-600">{loadError}</p>}

        {nextCursor && (
          <div className="pt-4 text-center">
            <button
              onClick={handleLoadMore}
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#0f2a4a] transition-all hover:bg-slate-50 disabled:opacity-50"
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
