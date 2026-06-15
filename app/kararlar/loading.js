// app/kararlar/loading.js
// Arama / sayfa geçişi sırasında gösterilen özel skeleton.
// route segment'e bırakıldığı için router.push (HeroSearch) ile tetiklenir.
export default function Loading() {
  return (
    <div className="law-root">
      <div className="law-wrap">
        <div className="results-head">
          <span className="lbl">Aranıyor…</span>
          <div className="rule" />
        </div>

        <div className="stack">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </div>
    </div>
  );
}