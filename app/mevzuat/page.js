// app/mevzuat/page.js
// Sade fakat şık bir liste: tüm mevzuatlar. Arama / sayfalama yok.

import prisma from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Mevzuat | Karar Platformu",
  description: "Tüm mevzuatların listesi. Arama ve filtre yok; hızlı erişim için sade görünüm.",
};

// Her istekte taze veri
export const dynamic = "force-dynamic";

function sanitizeTrText(s = "") {
  const n = String(s || "").normalize("NFC");
  // 'i' + COMBINING DOT ABOVE -> 'i'
  // 'I' + COMBINING DOT ABOVE -> 'İ'
  return n
    .replace(/\u0069\u0307/g, "i")
    .replace(/\u0049\u0307/g, "İ");
}

function pickTitle(it) {
  const t = sanitizeTrText((it.shortName || "").trim());
  if (t) return t;
  return sanitizeTrText(it.name || "(Başlık Yok)");
}

function pickSubtitle(it) {
  const s = sanitizeTrText((it.shortName || "").trim());
  const n = sanitizeTrText((it.name || "").trim());
  if (s && n && s !== n) return n;
  return null;
}

// TR uyumlu ilk harf (gruplama için)
function firstLetterTR(s = "") {
  const tr = s.trim();
  if (!tr) return "#";
  const c = tr[0]
    .replace("İ", "I")
    .replace("ı", "i");
  return c.toUpperCase();
}

export default async function MevzuatPage() {
  // Tüm mevzuatları oku
  const rows = await prisma.mevzuat.findMany({
    orderBy: [{ shortName: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      shortName: true,
      year: true,
      articleCount: true,
      key: true,
    },
  });

  // Görünüm modeline çevir + grupla
  const items = rows.map((it) => {
    const title = pickTitle(it);
    const kanunNo = String(it.key || "").match(/\d+/)?.[0] || null;
    return {
      id: it.id,
      slug: it.slug,
      title,
      subtitle: pickSubtitle(it),
      year: it.year,
      articleCount: it.articleCount,
      letter: firstLetterTR(title),
      kanunNo,
    };
  });

  items.sort((a, b) => a.title.localeCompare(b.title, "tr"));

  const groups = items.reduce((acc, it) => {
    (acc[it.letter] ||= []).push(it);
    return acc;
  }, /** @type {Record<string, typeof items>} */ ({}));

  const letters = Object.keys(groups).sort((a, b) => a.localeCompare(b, "tr"));

  return (
    <div lang="tr" className="min-h-screen bg-[#001f3f]">
      {/* HEADER */}
      <header className="w-full bg-blue-900/30 border-b border-blue-700/60 shadow-xl py-6">
        <div className="max-w-screen-2xl mx-auto px-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-200">Mevzuat</h1>
            <p className="text-sm text-blue-300/90 mt-1">Tüm mevzuatlar listelenir</p>
          </div>
          <span className="rounded-full border border-blue-700/70 bg-blue-900/20 px-3 py-1 text-xs text-blue-200/90">
            {items.length} kayıt
          </span>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-screen-2xl mx-auto px-4 py-8 space-y-8">
        {letters.map((L) => (
          <section key={L} className="space-y-4">
            {/* Grup başlığı */}
            <div className="sticky top-20 z-10 -mx-1 w-fit rounded-full border border-blue-700/50 bg-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-200/90 backdrop-blur">
              {L}
            </div>

            {/* Grid kartlar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups[L].map((it) => (
                <Link
                  href={`/mevzuat/${it.slug ?? ""}`}
                  key={it.id}
                  className="group block rounded-xl border border-blue-700/50 bg-blue-900/20 p-4 hover:bg-blue-900/35 hover:border-blue-500/60 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-blue-100 font-semibold leading-6 group-hover:text-white truncate">
                        {it.title}
                      </h3>
                      {it.subtitle ? (
                        <p className="mt-1 text-sm text-blue-300/85 line-clamp-2">{it.subtitle}</p>
                      ) : null}
                    </div>

                    {/* Sağ rozetler */}
                    <div className="shrink-0 text-right space-y-1">
                      {typeof it.year === "number" ? (
                        <span className="inline-block rounded-full border border-blue-700/60 bg-blue-800/40 px-2 py-0.5 text-[11px] text-blue-200/90">
                          {it.year}
                        </span>
                      ) : null}
                      {it.kanunNo ? (
                        <div className="text-[11px] text-blue-300/80">
                          {`${it.kanunNo} s. kanun`}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Alt çizgi ve ok */}
                  <div className="mt-3 flex items-center justify-between text-xs text-blue-300/70">
                    <span>Detay sayfasına git</span>
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {!items.length && (
          <div className="rounded-xl border border-blue-700/50 bg-blue-900/20 p-8 text-center text-sm text-blue-200/80">
            Şu anda listelenecek mevzuat bulunamadı.
          </div>
        )}
      </main>
    </div>
  );
}