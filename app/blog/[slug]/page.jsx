// app/blog/[slug]/page.jsx
// Tekil blog yazısı — statik üretilir. Tam SEO: dinamik metadata, canonical,
// OpenGraph/Twitter, BlogPosting + Breadcrumb + (varsa) FAQ JSON-LD şemaları.

import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";

import {
  getPostBySlug,
  getAllSlugs,
  getRelatedPosts,
  formatDateTR,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  SITE,
} from "@/lib/blog";

import BlogTheme from "@/components/blog/BlogTheme";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { PostCard } from "@/components/blog/PostCard";

// Build sırasında tüm yazılar için statik sayfa üret
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

// --- SEO: her yazı için dinamik metadata ---
export function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Yazı bulunamadı | Consülto" };

  const urlAbs = `${SITE.url}${SITE.blogBase}/${post.slug}`;
  const ogImage = post.cover ? `${SITE.url}${post.cover}` : SITE.defaultOgImage;

  return {
    title: `${post.title} | Consülto Hukuk Blogu`,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    alternates: { canonical: urlAbs },
    openGraph: {
      type: "article",
      locale: SITE.locale,
      url: urlAbs,
      siteName: SITE.name,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      authors: [post.author],
      section: post.category,
      tags: post.tags,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      site: SITE.twitter,
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

// MDX içinde kullanılabilecek özel bileşenler (yazıya zengin öğe gömmek için)
const mdxComponents = {
  // Yazı içine "araç çağrısı" kutusu gömmek için: <ToolBox href="/araclar/kidem-tazminati" title="..." />
  ToolBox: ({ href, title, desc }) => (
    <Link href={href} style={{ textDecoration: "none" }}>
      <span style={{
        display: "block", padding: "20px 22px", margin: "1.6em 0",
        background: "var(--surface)", border: "1px solid var(--line-strong)",
        borderRadius: "12px", borderLeft: "3px solid var(--amber)",
      }}>
        <strong style={{ color: "var(--navy)", fontFamily: "'Inter', sans-serif", fontSize: "0.95rem" }}>
          🛠 {title}
        </strong>
        {desc && (
          <span style={{ display: "block", marginTop: 6, color: "var(--ink-soft)", fontSize: "0.92rem", fontFamily: "'Inter', sans-serif" }}>
            {desc}
          </span>
        )}
      </span>
    </Link>
  ),
};

export default function BlogPostPage({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const related = getRelatedPosts(post.slug, post.category, post.tags, 3);

  const articleLd = buildArticleJsonLd(post);
  const breadcrumbLd = buildBreadcrumbJsonLd(post);
  const faqLd = buildFaqJsonLd(post.faq);

  return (
    <div className="blog-root">
      <BlogTheme />

      {/* JSON-LD: zengin sonuçlar için kritik */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}

      <BlogHeader />

      <article className="blog-wrap-narrow">
        <header className="article-head">
          {/* Kırıntı yolu — hem UX hem SEO */}
          <nav className="breadcrumb" aria-label="breadcrumb">
            <Link href="/">Ana Sayfa</Link>
            <span className="crumb-sep">/</span>
            <Link href="/blog">Blog</Link>
            <span className="crumb-sep">/</span>
            <span>{post.category}</span>
          </nav>

          <h1 className="article-title">{post.title}</h1>

          <div className="article-meta">
            <span>{post.author}</span>
            <span className="dot" />
            <time dateTime={post.date}>{formatDateTR(post.date)}</time>
            <span className="dot" />
            <span>{post.readingTime.text}</span>
            <span className="dot" />
            <span>{post.category}</span>
          </div>

          {post.cover && <img className="article-cover" src={post.cover} alt={post.title} />}
        </header>

        {/* MDX gövde */}
        <div className="prose">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>

        {/* Etiketler */}
        {post.tags.length > 0 && (
          <div className="tag-row">
            {post.tags.map((t) => (
              <span key={t} className="tag">#{t}</span>
            ))}
          </div>
        )}

        {/* Yazı sonu dönüşüm kutusu — ana ürüne yönlendir */}
        <div className="article-cta">
          <h3>Bu konuyu kendi dosyanda çözmek ister misin?</h3>
          <p>
            Consülto, dosyanı analiz eder, ilgili Yargıtay kararlarını getirir ve dilekçeni yazar.
            İlk 2 token ücretsiz.
          </p>
          <Link href="/calisma-alani">
            Ücretsiz Dene
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* İlgili yazılar */}
        {related.length > 0 && (
          <>
            <div className="section-rule">
              <span className="lbl">İlgili Yazılar</span>
              <span className="rule" />
            </div>
            <div className="related-grid">
              {related.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </>
        )}
      </article>
    </div>
  );
}