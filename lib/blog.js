// lib/blog.js
// MDX tabanlı blog içeriğini okuyan ve SEO yardımcılarını barındıran katman.
// Yazılar: /content/blog/*.mdx — her dosyanın başında frontmatter (gray-matter) bulunur.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

// Site genel ayarları — JSON-LD ve canonical için tek kaynak
export const SITE = {
  name: "Consülto",
  url: "https://consultohukuk.com",
  blogBase: "/blog",
  logo: "https://consultohukuk.com/images/logo.png",
  twitter: "@consultohukuk",
  publisher: "Consülto Hukuk",
  defaultOgImage: "https://consultohukuk.com/blog/yapay-zeka/kapak.jpg",
  locale: "tr_TR",
};

// Okuma süresini tahmin et (TR ortalama ~200 kelime/dk)
function readingTime(content = "") {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return { words, minutes, text: `${minutes} dk okuma` };
}

// Tüm yazıların meta verisini (içerik hariç) döndürür — liste sayfası için
export function getAllPosts() {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  const posts = files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
      const { data, content } = matter(raw);

      // Taslakları (draft: true) production'da gizle
      if (data.draft && process.env.NODE_ENV === "production") return null;

      return {
        slug,
        title: data.title || slug,
        description: data.description || "",
        date: data.date || null,
        updated: data.updated || data.date || null,
        category: data.category || "Hukuk",
        tags: Array.isArray(data.tags) ? data.tags : [],
        author: data.author || SITE.publisher,
        cover: data.cover || null,
        featured: !!data.featured,
        readingTime: readingTime(content),
      };
    })
    .filter(Boolean);

  // En yeniden eskiye
  posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  return posts;
}

// Tek bir yazının tüm verisini (içerik dahil) döndürür — tekil sayfa için
export function getPostBySlug(slug) {
  const fullPath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title || slug,
    description: data.description || "",
    date: data.date || null,
    updated: data.updated || data.date || null,
    category: data.category || "Hukuk",
    tags: Array.isArray(data.tags) ? data.tags : [],
    author: data.author || SITE.publisher,
    cover: data.cover || null,
    faq: Array.isArray(data.faq) ? data.faq : [], // FAQ şeması için
    readingTime: readingTime(content),
    content,
  };
}

// Statik üretim (generateStaticParams) için tüm slug'lar
export function getAllSlugs() {
  return getAllPosts().map((p) => p.slug);
}

// İlgili yazıları (aynı kategori/etiket) bul — tekil sayfada gösterim için
export function getRelatedPosts(currentSlug, category, tags = [], limit = 3) {
  const all = getAllPosts().filter((p) => p.slug !== currentSlug);
  const scored = all
    .map((p) => {
      let score = 0;
      if (p.category === category) score += 2;
      score += p.tags.filter((t) => tags.includes(t)).length;
      return { post: p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const result = scored.map((x) => x.post);
  // Yeterli ilgili yoksa en yeni yazılarla tamamla
  if (result.length < limit) {
    for (const p of all) {
      if (result.length >= limit) break;
      if (!result.includes(p)) result.push(p);
    }
  }
  return result.slice(0, limit);
}

// TR tarih formatı
export function formatDateTR(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

// ---- JSON-LD şema üreticileri ----

// Tekil blog yazısı için BlogPosting şeması (zengin sonuç için kritik)
export function buildArticleJsonLd(post) {
  const urlAbs = `${SITE.url}${SITE.blogBase}/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.cover ? [`${SITE.url}${post.cover}`] : [SITE.defaultOgImage],
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { "@type": "Organization", name: post.author, url: SITE.url },
    publisher: {
      "@type": "Organization",
      name: SITE.publisher,
      logo: { "@type": "ImageObject", url: SITE.logo },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": urlAbs },
    inLanguage: "tr-TR",
    articleSection: post.category,
    keywords: post.tags.join(", "),
  };
}

// Breadcrumb şeması — Google'da kırıntı yolu gösterir
export function buildBreadcrumbJsonLd(post) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE.url}${SITE.blogBase}` },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE.url}${SITE.blogBase}/${post.slug}`,
      },
    ],
  };
}

// FAQ şeması — frontmatter'da faq tanımlıysa "Sıkça Sorulan Sorular" zengin sonucu
export function buildFaqJsonLd(faq = []) {
  if (!faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
