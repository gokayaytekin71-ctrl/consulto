"use client";

import { useState, useEffect } from "react";

/* ─── Typewriter soruları ─── */
const QUESTIONS = [
  "Kıdem tazminatı hesabında son ücret nasıl belirlenir?",
  "İşe iade davası açma süresi ne zaman başlar?",
  "Trafik kazasında manevi tazminat talep edebilir miyim?",
  "Boşanmada ortak ev ve araç nasıl paylaşılır?",
  "Haksız fesihte ihbar tazminatı ne kadardır?",
  "Destekten yoksun kalma tazminatı nasıl hesaplanır?",
];

/* ─── Chip'ler ─── */
const CHIPS = [
  { label: "Kıdem tazminatı", icon: "💼" },
  { label: "Boşanma davası",  icon: "⚖️" },
  { label: "Trafik kazası",   icon: "🚗" },
  { label: "İşe iade",        icon: "📋" },
  { label: "Yargıtay kararı", icon: "🔍" },
];

/* ─── Demo yanıtları ─── */
const RESPONSES = {
  kıdem: {
    topic: "Kıdem tazminatı · Son ücret analizi",
    intro: "4857 sayılı İş Kanunu m.120 ve 1475 sayılı Kanun m.14 uyarınca tazminata esas son ücret kapsamı şöyle belirlenir:",
    bullets: [
      "Brüt temel ücret (iş akdinin feshedildiği tarihteki son maaş)",
      "Düzenli ödenen prim, ikramiye ve komisyon ödemeleri",
      "Yemek, yol ve konut yardımları (nakdi olanların tamamı)",
    ],
    note: "Değişken ödemelerde son 12 ayın ortalaması esas alınır; Yargıtay bu konuda tutarlı içtihat oluşturmuştur.",
    citation: {
      court: "Yargıtay 9. HD",
      decision: "2023/8341 E. · 2024/912 K.",
      snippet: "\"Kıdem tazminatına esas ücretin tespitinde işçiye düzenli ve sistemli biçimde yapılan tüm ödemeler dikkate alınmalıdır.\"",
    },
  },
  boşan: {
    topic: "Boşanma davası · Hukuki analiz",
    intro: "Türk Medeni Kanunu m.166 uyarınca anlaşmalı boşanmada mahkemenin incelediği üç temel unsur:",
    bullets: [
      "En az 1 yıllık evlilik şartı — anlaşmalı boşanma için zorunludur (TMK m.166/3)",
      "Boşanmanın sonuçları konusunda tam ve özgür irade ile uzlaşma",
      "Müşterek çocuklar varsa velayet, kişisel ilişki ve nafaka düzenlemesi",
    ],
    note: "Çekişmeli boşanmada kusur oranı, maddi ve manevi tazminat miktarını doğrudan belirler.",
    citation: {
      court: "Yargıtay 2. HD",
      decision: "2023/4521 E. · 2024/611 K.",
      snippet: "\"Eşit kusur durumunda taraflardan birinin manevi tazminat talebi kabul edilemez.\"",
    },
  },
  trafik: {
    topic: "Trafik kazası · Tazminat analizi",
    intro: "2918 sayılı KTK ve Borçlar Kanunu kapsamında üç ayrı tazminat kalemi değerlendirilir:",
    bullets: [
      "Maddi zarar: tedavi giderleri ve geçici iş göremezlik kaybı",
      "Sürekli iş göremezlik: maluliyet oranına göre aktüeryal hesap (PMF 1931)",
      "Manevi tazminat: kusur oranı, sakatlık derecesi ve ıstırap süresine göre takdir",
    ],
    note: "Sigorta tahkim başvurusu, dava yolundan önce değerlendirilmesi gereken alternatiftir.",
    citation: {
      court: "Yargıtay 17. HD",
      decision: "2022/9823 E. · 2023/441 K.",
      snippet: "\"PMF 1931 tablosu esas alınarak yapılan aktüeryal hesaplama doğru ve yerindedir.\"",
    },
  },
  iade: {
    topic: "İşe iade davası · Prosedür analizi",
    intro: "4857 sayılı İş Kanunu m.20 uyarınca işe iade davasında süreler hak düşürücüdür, dikkat edilmesi gereken adımlar:",
    bullets: [
      "Fesih bildiriminden itibaren 1 ay içinde arabulucuya başvuru (zorunlu ön koşul)",
      "Arabuluculuk son tutanağından itibaren 2 hafta içinde dava açılması",
      "4+ aylık kıdem ve 30+ işçili işyeri şartı sağlanmış olmalıdır (İK m.18)",
    ],
    note: "Bu süreler kesin olup kaçırılması halinde dava usulden reddedilir, yargısal denetim mümkün değildir.",
    citation: {
      court: "Yargıtay 9. HD",
      decision: "2023/7102 E. · 2024/1034 K.",
      snippet: "\"1 aylık hak düşürücü süre, fesih bildiriminin işçiye tebliğ tarihinden itibaren işlemeye başlar.\"",
    },
  },
  yargıtay: {
    topic: "Yargıtay kararı · Semantik arama",
    intro: "1.000.000+ Yargıtay kararı içinde yapay zeka destekli semantik arama şu aşamalarla çalışır:",
    bullets: [
      "Konu ve hukuki kavrama göre daire filtresi (HGK, CGK veya özel daireler)",
      "Kavramsal benzerlik analizi — salt anahtar kelime değil, bağlamsal anlam taraması",
      "İçtihat değişimi zaman çizgisi ve güncel baskın görüş tespiti",
    ],
    note: "Bulunan kararlar doğrudan dilekçeye kaynak olarak eklenip atıf gösterilebilir.",
    citation: {
      court: "Yargıtay HGK",
      decision: "2022/1099 E. · 2024/355 K.",
      snippet: "\"Emsal niteliğindeki bu karar, alt mahkemeler için bağlayıcı içtihat oluşturmuştur.\"",
    },
  },
  varsayılan: {
    topic: "Hukuki analiz tamamlandı",
    intro: "Sorunuz mevzuat ve Yargıtay içtihadı çerçevesinde değerlendirildi. Tespit edilen başlıca noktalar:",
    bullets: [
      "Uygulanacak temel hukuki norm ve güncel mevzuat belirlendi",
      "Benzer davalardaki Yargıtay tutumu ve baskın görüş analiz edildi",
      "Hak kaybına yol açabilecek prosedürel riskler ve kritik süreler tespit edildi",
    ],
    note: "Tam analiz için dosyanızı yükleyin; Consülto belge özelinde emsal kararları tarar ve dilekçe hazırlar.",
    citation: {
      court: "Yargıtay HGK",
      decision: "2023/156 K.",
      snippet: "\"Yerleşik içtihat doğrultusunda yapılan bu değerlendirmede...\"",
    },
  },
};

function findResponse(query) {
  const q = query.toLowerCase();
  if (q.includes("kıdem"))                         return RESPONSES.kıdem;
  if (q.includes("boşan"))                         return RESPONSES.boşan;
  if (q.includes("trafik"))                        return RESPONSES.trafik;
  if (q.includes("işe iade") || q.includes("iade")) return RESPONSES.iade;
  if (q.includes("yargıtay") || q.includes("karar")) return RESPONSES.yargıtay;
  return RESPONSES.varsayılan;
}

/* ══════════════════════════════════════════════════════════ */
export default function HeroSearchInput() {
  /* input / typewriter */
  const [query,      setQuery]      = useState("");
  const [displayed,  setDisplayed]  = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [qIdx,       setQIdx]       = useState(0);

  /* yanıt paneli */
  const [phase,       setPhase]       = useState("idle"); // idle | thinking | streaming | done
  const [activeQuery, setActiveQuery] = useState("");
  const [response,    setResponse]    = useState(null);
  const [streamText,  setStreamText]  = useState("");

  /* ── typewriter ── */
  useEffect(() => {
    if (query || phase !== "idle") return;
    const current = QUESTIONS[qIdx];
    if (!isDeleting && displayed === current) {
      const t = setTimeout(() => setIsDeleting(true), 2400);
      return () => clearTimeout(t);
    }
    if (isDeleting && displayed === "") {
      setIsDeleting(false);
      setQIdx((i) => (i + 1) % QUESTIONS.length);
      return;
    }
    const t = setTimeout(() => {
      setDisplayed(isDeleting
        ? current.slice(0, displayed.length - 1)
        : current.slice(0, displayed.length + 1));
    }, isDeleting ? 20 : 55);
    return () => clearTimeout(t);
  }, [displayed, isDeleting, qIdx, query, phase]);

  /* ── thinking → streaming ── */
  useEffect(() => {
    if (phase !== "thinking") return;
    const t = setTimeout(() => { setStreamText(""); setPhase("streaming"); }, 850);
    return () => clearTimeout(t);
  }, [phase]);

  /* ── streaming ── */
  useEffect(() => {
    if (phase !== "streaming" || !response) return;
    const full = response.intro;
    if (streamText.length >= full.length) {
      const t = setTimeout(() => setPhase("done"), 180);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStreamText(full.slice(0, streamText.length + 1)), 22);
    return () => clearTimeout(t);
  }, [streamText, phase, response]);

  function submit(q) {
    const text = (q ?? query).trim();
    if (!text) return;
    setActiveQuery(text);
    setResponse(findResponse(text));
    setStreamText("");
    setPhase("thinking");
  }

  function reset() {
    setPhase("idle");
    setActiveQuery("");
    setResponse(null);
    setStreamText("");
    setQuery("");
  }

  return (
    <div className="mt-8">

      {/* ─────────── INPUT (sadece idle'da) ─────────── */}
      {phase === "idle" && (
        <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div className="
            rounded-2xl border-[1.5px] border-transparent
            [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,#3b82f6_0%,#06b6d4_50%,#8b5cf6_100%)_border-box]
            shadow-[0_4px_28px_-6px_rgba(37,99,235,0.18)]
            transition-shadow duration-300
            focus-within:shadow-[0_8px_36px_-6px_rgba(37,99,235,0.38)]
          ">
            {/* header şeridi */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 shadow-sm">
                <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-600">Consülto AI · Hukuki Asistan</span>
              <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700">Aktif</span>
              </div>
            </div>

            {/* input + typewriter */}
            <div className="relative px-4 py-5">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="relative z-10 w-full bg-transparent text-base font-medium text-slate-800 focus:outline-none lg:text-lg"
                autoComplete="off"
                aria-label="Hukuki sorunuzu yazın"
              />
              {!query && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center px-4 text-base font-medium text-slate-400 lg:text-lg">
                  {displayed}
                  <span className="ml-px inline-block h-[1.1em] w-[2px] rounded-full bg-blue-400 align-middle animate-pulse" />
                </div>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-3">
              <span className="flex-1 text-xs text-slate-400">
                {query ? `${query.length} karakter` : "Sorunuzu yazın veya aşağıdan bir konu seçin"}
              </span>
              <button
                type="submit"
                disabled={!query.trim()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_-4px_rgba(34,211,238,0.55)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Analiz Et
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ─────────── YANIT PANELİ ─────────── */}
      {phase !== "idle" && response && (
        <div
          key={activeQuery}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_48px_-8px_rgba(2,42,92,0.18)]"
          style={{ animation: "heroFadeIn 0.45s cubic-bezier(0.22,1,0.36,1) forwards" }}
        >
          <style>{`
            @keyframes heroFadeIn {
              from { opacity:0; transform:translateY(14px); }
              to   { opacity:1; transform:translateY(0); }
            }
            @keyframes heroBullet {
              from { opacity:0; transform:translateX(-10px); }
              to   { opacity:1; transform:translateX(0); }
            }
            @keyframes heroFade {
              from { opacity:0; }
              to   { opacity:1; }
            }
          `}</style>

          {/* panel başlığı */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-sm">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-slate-800">{response.topic}</div>
            </div>
            <button
              onClick={reset}
              aria-label="Kapat"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* içerik */}
          <div className="space-y-4 p-5">

            {/* thinking: üç nokta */}
            {phase === "thinking" && (
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {[0, 160, 320].map((d) => (
                    <span key={d} className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-500">Analiz ediliyor…</span>
              </div>
            )}

            {/* streaming + done: giriş metni */}
            {(phase === "streaming" || phase === "done") && (
              <p className="text-sm font-medium leading-relaxed text-slate-700">
                {phase === "streaming" ? streamText : response.intro}
                {phase === "streaming" && (
                  <span className="ml-0.5 inline-block h-[1em] w-[2px] rounded-full bg-blue-500 align-middle animate-pulse" />
                )}
              </p>
            )}

            {/* done: bullet'lar */}
            {phase === "done" && (
              <ul className="space-y-2.5">
                {response.bullets.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3"
                    style={{ animation: `heroBullet 0.45s ${i * 130}ms cubic-bezier(0.22,1,0.36,1) both` }}
                  >
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                    <span className="text-sm leading-relaxed text-slate-600">{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* done: not */}
            {phase === "done" && (
              <div
                className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3"
                style={{ animation: "heroFade 0.4s 420ms both" }}
              >
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium leading-relaxed text-amber-800">{response.note}</span>
              </div>
            )}

            {/* done: emsal karar */}
            {phase === "done" && (
              <div
                className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5"
                style={{ animation: "heroFade 0.4s 560ms both" }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-blue-600 text-[10px] font-black text-white shadow-sm">
                    YG
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-blue-700">Emsal Karar</div>
                    <div className="mt-0.5 text-sm font-bold text-slate-800">
                      {response.citation.court} · {response.citation.decision}
                    </div>
                    <div className="mt-1.5 text-[12px] italic leading-relaxed text-slate-600">
                      {response.citation.snippet}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA footer */}
          {phase === "done" && (
            <div
              className="border-t border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/40 px-5 py-4"
              style={{ animation: "heroFade 0.4s 700ms both" }}
            >
              <p className="mb-3 text-xs font-medium text-slate-500">
                Bu bir <span className="font-bold text-slate-700">önizlemedir</span> — gerçek analiz dosyanıza özel emsal kararlar ve hazır dilekçe içerir.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href={`/bot?q=${encodeURIComponent(activeQuery)}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_22px_-4px_rgba(34,211,238,0.5)]"
                >
                  Tam Analizini Gör
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <a
                  href="/dilekce"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Dilekçeye Dönüştür
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────── CHIP'LER (sadece idle'da) ─────────── */}
      {phase === "idle" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sık sorulanlar:</span>
          {CHIPS.map(({ label, icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => submit(label)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
