// app/ibk/page.js
// İBK listesi herkese aynı, session'a bağlı değil ve nadiren güncellenir.
// force-dynamic yerine ISR: sayfa 1 saatte bir arka planda yenilenir.
export const revalidate = 3600;

import prisma from "@/lib/prisma";

export const metadata = {
  title: "İçtihadı Birleştirme Kararları (İBK / İBGK)",
  description: "İBGK kayıtları — veriler public.ibbgk tablosundan listelenir. Kayıt tıklanınca PDF yeni sekmede açılır.",
};

// DB'den İBGK kayıtlarını çek
async function getIbbgkList() {
  const rows = await prisma.$queryRaw`
    SELECT id, karar_code, birlesme_no, ozet, pdf_url, created_at
    FROM public.ibbgk
    ORDER BY created_at DESC, id DESC
    LIMIT 200
  `;
  return rows || [];
}

export default async function IbkPage() {
  const rows = await getIbbgkList();

  const badgeClass = "text-sm md:text-base px-3 py-1.5 rounded-full bg-blue-800/40 border border-blue-600/50 text-blue-100 font-semibold";

  return (
    <div className="bg-[#001f3f] min-h-screen">
      {/* HEADER */}
      <header className="w-full bg-blue-900/30 border-b border-blue-700/60 shadow-xl py-4">
        <div className="max-w-screen-2xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-200">
            İçtihadı Birleştirme Kararları
          </h1>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-screen-2xl mx-auto px-4 py-8 space-y-8">
        {!rows.length ? (
          <div className="text-blue-200/80">Henüz kayıt yok.</div>
        ) : (
          <ul role="list" className="space-y-4">
            {rows.map((r) => {
              const href = r.pdf_url || "";
              const clickable = Boolean(href && String(href).trim().length);
              return (
                <li key={`ibbgk-${r.id}`} className="group">
                  {clickable ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="PDF’i yeni sekmede aç"
                      className="block rounded-xl border border-blue-700/50 bg-blue-900/20 p-4 hover:bg-blue-900/30 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={badgeClass}>
                          {r.karar_code || "Esas bilgisi yok"}
                        </span>
                        {r.birlesme_no ? (
                          <span className={badgeClass}>
                            {r.birlesme_no}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm md:text-base text-blue-100 text-justify">
                        <span className="font-semibold">Özet:</span>{" "}
                        {r.ozet || "Özet bulunamadı"}
                      </p>
                    </a>
                  ) : (
                    <div
                      aria-disabled
                      className="block rounded-xl border border-blue-700/50 bg-blue-900/10 p-4 opacity-60 cursor-not-allowed"
                      title="PDF bağlantısı bulunamadı"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={badgeClass}>
                          {r.karar_code || "Esas bilgisi yok"}
                        </span>
                        {r.birlesme_no ? (
                          <span className={badgeClass}>
                            {r.birlesme_no}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm md:text-base text-blue-100 text-justify">
                        <span className="font-semibold">Özet:</span>{" "}
                        {r.ozet || "Özet bulunamadı"}
                      </p>
                      <div className="text-[11px] text-blue-300/80 mt-2">PDF bağlantısı henüz eklenmemiş.</div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}