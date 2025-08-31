// app/mevzuat/[slug]/page.js
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";

const globalForPrisma = globalThis;
const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// İstediğin Türkçe slug/anchor üretimi (seed’dekiyle uyumlu)
function slugifyTr(s = "") {
  return String(s)
    .normalize("NFKD")
    .replace(/Ğ/g, "g")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/ü/g, "u")
    .replace(/Ş/g, "s")
    .replace(/ş/g, "s")
    .replace(/İ/g, "i")
    .replace(/ı/g, "i")
    .replace(/Ö/g, "o")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/ç/g, "c")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeRegex(s = "") {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text, q) {
  if (!q) return text;
  const re = new RegExp(`(${escapeRegex(q)})`, "gi");
  const chunks = String(text).split(re);
  return chunks.map((chunk, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded px-1 bg-amber-200 dark:bg-amber-500/40 text-zinc-900">
        {chunk}
      </mark>
    ) : (
      <span key={i}>{chunk}</span>
    )
  );
}

function withLineBreaks(text, q) {
  const lines = String(text).split("\n");
  const out = [];
  lines.forEach((line, idx) => {
    if (idx > 0) out.push(<br key={`br-${idx}`} />);
    out.push(
      <span key={`ln-${idx}`} className="whitespace-pre-wrap">
        {highlight(line, q)}
      </span>
    );
  });
  return out;
}

function renderMaddeMetin(text, q) {
  const paras = String(text).trim().split(/\n{2,}/);
  return paras.map((p, i) => (
    <p key={i} className="leading-7 text-zinc-800 dark:text-zinc-200">
      {withLineBreaks(p, q)}
    </p>
  ));
}

async function getData(slug, q) {
  const mevzuat = await prisma.mevzuat.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, articleCount: true },
  });
  if (!mevzuat) return null;

  const whereMadde = { mevzuatId: mevzuat.id };
  if (q && q.trim()) {
    whereMadde.OR = [
      { maddeNo: { contains: q, mode: "insensitive" } },
      { maddeBaslik: { contains: q, mode: "insensitive" } },
      { maddeMetin: { contains: q, mode: "insensitive" } },
    ];
  }

  const [totalCount, maddeler] = await Promise.all([
    prisma.mevzuatMadde.count({ where: { mevzuatId: mevzuat.id } }),
    prisma.mevzuatMadde.findMany({
      where: whereMadde,
      orderBy: [{ maddeNoOrder: "asc" }, { orderIndex: "asc" }],
      select: {
        id: true,
        maddeNo: true,
        maddeNoOrder: true,
        maddeBaslik: true,
        maddeUstBaslik: true,
        kisim: true,
        bolum: true,
        ayrim: true,
        maddeMetin: true,
        orderIndex: true,
      },
    }),
  ]);

  return { mevzuat, maddeler, totalCount, filteredCount: maddeler.length };
}

export async function generateMetadata({ params }) {
  const { slug } = params || {};
  const mev = await prisma.mevzuat.findUnique({
    where: { slug },
    select: { name: true },
  });
  if (!mev) return {};
  return {
    title: `${mev.name} | Mevzuat`,
    description: `${mev.name} mevzuatı ve maddeleri`,
  };
}

// İstersen cache kapat: export const revalidate = 0;

export default async function Page({ params, searchParams }) {
  const slug = params?.slug;
  const q = (searchParams?.q || "").toString().trim();

  const data = await getData(slug, q);
  if (!data) notFound();

  const { mevzuat, maddeler, totalCount, filteredCount } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Üst başlık ve arama */}
      <header className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {mevzuat.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Gösterilen{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-200">{filteredCount}</span>{" "}
              / Toplam{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-200">{totalCount}</span>{" "}
              madde{q ? (
                <>
                  {" "}
                  — arama: <span className="font-mono">“{q}”</span>
                </>
              ) : null}
            </p>
          </div>

          <form method="GET" action="" className="w-full max-w-md">
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Madde no / başlık / metin içinde ara
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="örn. 'geçici 1', 'taşınmaz', 'harç'…"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none ring-0 focus:border-zinc-400 dark:focus:border-zinc-500"
              />
              {q ? (
                <a
                  href={`./${""}`}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  title="Temizle"
                >
                  Temizle
                </a>
              ) : (
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Ara
                </button>
              )}
            </div>
          </form>
        </div>
      </header>

      {/* İçerik + İçindekiler */}
      <div className="grid grid-cols-12 gap-6">
        {/* İçindekiler */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="sticky top-6 max-h-[75vh] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
            <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              İçindekiler
            </h2>
            <nav className="space-y-1 text-sm">
              {maddeler.map((m) => {
                const base = String(m.maddeNo ?? m.orderIndex);
                const clean = base.replace(/^madde\s*/i, "");
                const anchor = `madde-${slugifyTr(clean)}`;
                return (
                  <a
                    key={m.id}
                    href={`#${anchor}`}
                    className="block rounded-md px-2 py-1 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    title={m.maddeBaslik || ""}
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {m.maddeNo}
                    </span>{" "}
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {m.maddeBaslik ? `— ${m.maddeBaslik}` : ""}
                    </span>
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Maddeler */}
        <main className="col-span-12 lg:col-span-9">
          <div className="space-y-10">
            {maddeler.map((m) => {
              const base = String(m.maddeNo ?? m.orderIndex);
              const clean = base.replace(/^madde\s*/i, "");
              const anchor = `madde-${slugifyTr(clean)}`;
              return (
                <section
                  key={m.id}
                  id={anchor}
                  className="scroll-mt-24 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5"
                >
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      <span className="text-zinc-700 dark:text-zinc-200">Madde</span>{" "}
                      <span className="text-zinc-900 dark:text-zinc-100">{m.maddeNo}</span>
                      {m.maddeBaslik ? (
                        <>
                          {" "}
                          — <span className="text-zinc-700 dark:text-zinc-300">{highlight(m.maddeBaslik, q)}</span>
                        </>
                      ) : null}
                    </h3>
                    <a
                      href={`#${anchor}`}
                      className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      title="Bağlantıyı kopyala"
                    >
                      #
                    </a>
                  </div>

                  {/* Üst başlık / bölüm bilgileri varsa küçük gri bant */}
                  {(m.maddeUstBaslik || m.kisim || m.bolum || m.ayrim) && (
                    <div className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                      {[m.maddeUstBaslik, m.kisim, m.bolum, m.ayrim]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                  )}

                  <div className="prose max-w-none prose-p:my-3 dark:prose-invert">
                    {renderMaddeMetin(m.maddeMetin || "", q)}
                  </div>
                </section>
              );
            })}
          </div>
        </main>
      </div>

      {/* dipnot */}
      <footer className="mt-10 border-t border-zinc-200 dark:border-zinc-800 pt-6 text-xs text-zinc-500 dark:text-zinc-400">
        <a
          href="/mevzuat"
          className="rounded-md border border-transparent px-2 py-1 hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ← Mevzuat listesine dön
        </a>
      </footer>
    </div>
  );
}