"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { VariableSizeList as List } from 'react-window';

import DecisionCard from '@/components/DecisionCard';
import SearchResultItem from '@/components/SearchResultItem';
import LoadingOverlay from '@/components/LoadingOverlay';
import NoResults from '@/components/NoResults';

const Row = ({ index, style, data }) => {
  const { kararlar, defaultQuery, openItems, toggleItem, handleHeightChange } = data;
  const k = kararlar[index];

  return (
    <div style={style}>
      <div className="px-1 pb-8">
        <SearchResultItem
          key={k.id}
          id={k.id}
          slug={k.slug}
          typeLabel={k.typeLabel}   // ← ÖNCELİKLE BUNU KULLANIYORUZ
          mahkeme={k.mahkeme}       // ← Yedek
          type={k.type}             // ← En son yedek (yargi_karari olabilir)
          code={k.code}
          snippet={k.snippet}
          aiSummary={k.aiSummary}
          keywords={k.keywords}
          query={defaultQuery}
          score={k.score}
          isOpen={!!openItems[k.id]}
          onToggle={toggleItem}
          onHeightChange={handleHeightChange}
        />
      </div>
    </div>
  );
};

export default function ClientSearchResults({
  defaultQuery = '',
  semanticSearch = false,
  initialData = []
}) {
  const [kararlar, setKararlar] = useState(initialData || []);
  const [isLoading, setIsLoading] = useState(false);
  const [openItems, setOpenItems] = useState({});

  const listRef = useRef(null);
  const sizeMap = useRef({});

  const toggleItem = (id) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleHeightChange = useCallback((id, height) => {
    const PADDING_BOTTOM = 32;
    const newHeight = height + PADDING_BOTTOM;
    if (sizeMap.current[id] !== newHeight) {
      sizeMap.current = { ...sizeMap.current, [id]: newHeight };
      if (listRef.current) listRef.current.resetAfterIndex(0, true);
    }
  }, []);

  const getItemSize = index => {
    const karar = kararlar[index];
    return sizeMap.current[karar.id] || 380;
  };

  const fetchResults = useCallback(async (q) => {
    if (!q) { setKararlar([]); return; }

    setIsLoading(true);
    const endpoint = semanticSearch
      ? `/api/semantic-search?q=${encodeURIComponent(q)}`
      : `/api/kararlar?q=${encodeURIComponent(q)}`;

    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`API hatası: ${res.status}`);
      const data = await res.json();
      const raw = semanticSearch ? data : (data.results || []);

      // Yalnızca karar; Prisma’dan gelen type & code’u olduğu gibi kullan
      const prepped = raw
        .filter(it => (it.kaynak_turu ? it.kaynak_turu !== 'ai_ozet' : true))
        .map(it => {
          // tekilleştirme ve link için güvenli kimlik
          const primary =
            it.orijinal_karar_id || it.id || (it.fileName ? it.fileName.replace(/\.txt$/i, '') : undefined);

          return {
            ...it,
            id: String(primary ?? crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
            slug: it.slug || String(primary ?? ''),   // varsa slug; yoksa id
            type: it.type || '',                      // Prisma type (DAİRE)
            code: it.code || '',                      // Prisma code (Esas/Karar)
            keywords: it.keywords || [],
            aiSummary: it.aiSummary || ''
          };
        });

      // aynı kararı bir kez göster
      const unique = Array.from(new Map(prepped.map(r => [r.id, r])).values());
      setKararlar(unique);
    } catch (e) {
      console.error("Fetch error:", e);
      setKararlar([]);
    } finally {
      setIsLoading(false);
    }
  }, [semanticSearch]);

  useEffect(() => {
    if (defaultQuery) fetchResults(defaultQuery);
  }, [defaultQuery, fetchResults]);

  if (isLoading) return <LoadingOverlay />;
  if (!isLoading && kararlar.length === 0 && defaultQuery) return <NoResults />;

  return (
    <div className="mt-0">
      {semanticSearch ? (
        <List
          ref={listRef}
          height={typeof window !== 'undefined' ? window.innerHeight - 250 : 1000}
          itemCount={kararlar.length}
          itemSize={getItemSize}
          width={'100%'}
          itemData={{ kararlar, defaultQuery, openItems, toggleItem, handleHeightChange }}
        >
          {Row}
        </List>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {kararlar.map(k => (
            <DecisionCard key={k.id} {...k} slug={k.slug} />
          ))}
        </div>
      )}
    </div>
  );
}