// app/blog/page.jsx
// Blog ana liste sayfası — statik üretilir (SSG). En yeni yazı "öne çıkan" olarak geniş gösterilir.

import { getAllPosts, SITE } from "@/lib/blog";
import BlogTheme from "@/components/blog/BlogTheme";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { PostCard } from "@/components/blog/PostCard";

// --- SEO: liste sayfası metadata ---
export const metadata = {
  title: "Hukuk Blogu | Yargıtay İçtihatları, Dilekçe ve Uygulama Rehberleri — Consülto",
  description:
    "Yargıtay kararları analizi, dilekçe örnekleri, tazminat hesaplama rehberleri ve güncel hukuki gelişmeler. Avukatlar ve hukukçular için pratik, emsallerle desteklenen içerikler.",
  keywords: [
    "hukuk blogu", "Yargıtay kararları", "dilekçe örneği", "tazminat hesaplama",
    "içtihat", "kıdem tazminatı", "araç değer kaybı", "hukuki rehber",
  ],
  alternates: { canonical: `${SITE.url}${SITE.blogBase}` },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: `${SITE.url}${SITE.blogBase}`,
    siteName: SITE.name,
    title: "Consülto Hukuk Blogu — İçtihat ve Uygulama Rehberleri",
    description:
      "Yargıtay kararları analizi, dilekçe örnekleri ve tazminat hesaplama rehberleri.",
    images: [{ url: SITE.defaultOgImage, width: 1200, height: 630, alt: "Consülto Hukuk Blogu" }],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitter,
    title: "Consülto Hukuk Blogu",
    description: "Yargıtay içtihatları, dilekçe ve tazminat rehberleri.",
    images: [SITE.defaultOgImage],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const [first, ...rest] = posts;

  // Liste sayfası için CollectionPage + ItemList JSON-LD
  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Consülto Hukuk Blogu",
    url: `${SITE.url}${SITE.blogBase}`,
    description: metadata.description,
    publisher: { "@type": "Organization", name: SITE.publisher, url: SITE.url },
    blogPost: posts.slice(0, 20).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE.url}${SITE.blogBase}/${p.slug}`,
      datePublished: p.date,
      author: { "@type": "Organization", name: p.author },
    })),
  };

  return (
    <div className="blog-root">
      <BlogTheme />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }}
      />
      <BlogHeader />

      <div className="blog-wrap">
        <header className="blog-hero">
          <p className="blog-kicker">Consülto Yazıları</p>
          <h1 className="blog-h1">Hukukun pratiğine dair, emsallerle yazılmış rehberler</h1>
          <p className="blog-lede">
            Yargıtay içtihatları, dilekçe stratejileri ve tazminat hesaplamaları üzerine
            uygulamaya dönük yazılar. Her makale, gerçek kararlar ve güncel mevzuatla desteklenir.
          </p>
        </header>

        {posts.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontFamily: "'Newsreader', serif" }}>
            Henüz yayımlanmış bir yazı yok. İlk içerik yakında.
          </p>
        ) : (
          <>
            <div className="post-grid">
              {first && <PostCard post={first} featured />}
            </div>

            {rest.length > 0 && (
              <>
                <div className="section-rule">
                  <span className="lbl">Tüm Yazılar</span>
                  <span className="rule" />
                </div>
                <div className="post-grid">
                  {rest.map((p) => (
                    <PostCard key={p.slug} post={p} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}