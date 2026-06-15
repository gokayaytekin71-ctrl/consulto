"use client";

// components/HeroSearch.jsx
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Hero arama kutusu — native form submit (tam sayfa reload) yerine
 * client-side router.push + useTransition kullanır. Böylece:
 *  - "saçma sapan" overlay / flaş yok
 *  - isPending boyunca temiz inline spinner (.is-loading CSS'iyle)
 *  - app/kararlar/loading.js skeleton'ı düzgün tetiklenir
 */
export default function HeroSearch({ defaultQ = "" }) {
  const [q, setQ] = useState(defaultQ);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  function onSubmit(e) {
    e.preventDefault();

    const params = new URLSearchParams(searchParams.toString());
    const term = q.trim();

    if (term) params.set("q", term);
    else params.delete("q");

    // yeni arama -> sayfalamayı sıfırla
    params.delete("cursor");

    startTransition(() => {
      router.push(`/kararlar?${params.toString()}`);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`hero-form ${isPending ? "is-loading" : ""}`}
      aria-busy={isPending}
    >
      <span className="ic-search">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
      </span>

      <input
        type="text"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Karar içeriğinde, özette veya anahtar kelimede ara…"
        aria-label="Karar ara"
        className="hero-input"
      />

      <button type="submit" className="hero-submit" disabled={isPending}>
        <span className="hero-spinner" aria-hidden="true" />
        <span>{isPending ? "Aranıyor" : "Ara"}</span>
      </button>
    </form>
  );
}