// components/blog/BlogTheme.jsx
// "Editorial Law Review" tasarım dili — kararlar sayfasıyla birebir görsel uyum.
// Hem blog listesi hem tekil yazı sayfası bu temayı paylaşır.
// Sunucu bileşeni (server-safe): sadece <style> enjekte eder.

export const BLOG_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --paper:        #f6f3ec;
    --paper-2:      #efebe1;
    --surface:      #ffffff;
    --ink:          #1a1f2b;
    --ink-soft:     #4a5160;
    --ink-faint:    #8a8f9c;
    --navy:         #0f2a4a;
    --navy-2:       #163a63;
    --amber:        #b8860b;
    --amber-soft:   #c79a2e;
    --line:         #e3ddd0;
    --line-strong:  #d3ccba;
  }

  .blog-root {
    background-color: var(--paper);
    color: var(--ink);
    font-family: 'Inter', system-ui, sans-serif;
    background-image:
      radial-gradient(900px 500px at 100% -5%, rgba(15,42,74,0.05), transparent 60%),
      radial-gradient(700px 400px at -10% 110%, rgba(184,134,11,0.06), transparent 60%);
    background-attachment: fixed;
    min-height: 100vh;
    position: relative;
  }
  .blog-root::before {
    content: "";
    position: fixed; inset: 0;
    pointer-events: none; z-index: 0;
    opacity: 0.5;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
  }
  .blog-root > * { position: relative; z-index: 1; }

  /* ---------------- HEADER ---------------- */
  .blog-header {
    position: sticky; top: 0; z-index: 40;
    width: 100%;
    border-bottom: 1px solid var(--line);
    background: rgba(246,243,236,0.82);
    backdrop-filter: blur(14px);
  }
  .blog-header-inner {
    max-width: 1240px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 28px;
  }
  .brand { display: flex; align-items: center; gap: 13px; text-decoration: none; }
  .brand-mark {
    width: 42px; height: 42px; border-radius: 12px;
    background: var(--navy); color: #f3d27a;
    display: grid; place-items: center; flex-shrink: 0;
    box-shadow: 0 5px 16px -5px rgba(15,42,74,0.45);
  }
  .brand-name {
    font-family: 'Fraunces', serif;
    font-weight: 700; font-size: 1.15rem; letter-spacing: -0.01em;
    color: var(--navy); line-height: 1; display: block;
  }
  .brand-sub {
    font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.22em;
    color: var(--ink-faint); margin-top: 6px; display: block;
  }
  .nav-back {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 0.78rem; font-weight: 600; color: var(--ink-soft);
    text-decoration: none;
    background: var(--surface);
    border: 1px solid var(--line-strong);
    padding: 8px 16px; border-radius: 999px;
    transition: all .16s ease;
  }
  .nav-back:hover { color: var(--navy); border-color: var(--navy); }

  /* ---------------- LAYOUT ---------------- */
  .blog-wrap { max-width: 1240px; margin: 0 auto; padding: 56px 28px 120px; }
  .blog-wrap-narrow { max-width: 760px; margin: 0 auto; padding: 48px 28px 120px; }

  /* ---------------- HERO ---------------- */
  .blog-hero { margin-bottom: 56px; }
  .blog-kicker {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.64rem; text-transform: uppercase; letter-spacing: 0.24em;
    color: var(--amber); margin-bottom: 14px;
  }
  .blog-h1 {
    font-family: 'Fraunces', serif;
    font-weight: 600;
    font-size: clamp(2rem, 4vw, 3.1rem);
    line-height: 1.08; letter-spacing: -0.02em;
    color: var(--navy); max-width: 18ch;
    margin-bottom: 20px;
  }
  .blog-lede {
    font-family: 'Newsreader', Georgia, serif;
    font-size: 1.18rem; line-height: 1.6; color: var(--ink-soft);
    max-width: 56ch;
  }

  /* ---------------- KART GRID ---------------- */
  .post-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
    gap: 28px;
  }
  .post-card {
    display: flex; flex-direction: column;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    overflow: hidden;
    text-decoration: none;
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  }
  .post-card:hover {
    transform: translateY(-4px);
    border-color: var(--line-strong);
    box-shadow: 0 28px 60px -38px rgba(15,42,74,0.45);
  }
  .post-card-cover {
    aspect-ratio: 16 / 9; width: 100%;
    background: linear-gradient(135deg, var(--navy), var(--navy-2));
    position: relative; overflow: hidden;
  }
  .post-card-cover img { width: 100%; height: 100%; object-fit: cover; }
  .post-card-cover-fallback {
    position: absolute; inset: 0;
    display: grid; place-items: center;
    color: rgba(243,210,122,0.35);
    font-family: 'Fraunces', serif; font-size: 3rem; font-weight: 700;
  }
  .post-card-body { padding: 22px 22px 24px; display: flex; flex-direction: column; flex: 1; }
  .post-cat {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--amber); margin-bottom: 11px;
  }
  .post-card-title {
    font-family: 'Fraunces', serif;
    font-weight: 600; font-size: 1.28rem; line-height: 1.22;
    color: var(--navy); margin-bottom: 11px; letter-spacing: -0.01em;
  }
  .post-card-desc {
    font-family: 'Newsreader', Georgia, serif;
    font-size: 0.98rem; line-height: 1.55; color: var(--ink-soft);
    margin-bottom: 18px; flex: 1;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }
  .post-meta {
    display: flex; align-items: center; gap: 10px;
    font-size: 0.74rem; color: var(--ink-faint);
    padding-top: 14px; border-top: 1px solid var(--line);
  }
  .post-meta .sep { width: 4px; height: 4px; border-radius: 50%; background: var(--line-strong); }

  /* öne çıkan ilk yazı — geniş */
  .post-featured { grid-column: 1 / -1; display: grid; grid-template-columns: 1.1fr 1fr; }
  .post-featured .post-card-cover { aspect-ratio: auto; height: 100%; min-height: 280px; }
  .post-featured .post-card-title { font-size: 1.85rem; }
  .post-featured .post-card-desc { -webkit-line-clamp: 4; font-size: 1.05rem; }

  /* ---------------- BÖLÜM ETİKETİ ---------------- */
  .section-rule { display: flex; align-items: center; gap: 16px; margin: 56px 0 28px; }
  .section-rule .lbl {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.66rem; font-weight: 500; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--amber);
  }
  .section-rule .rule { height: 1px; flex: 1; background: var(--line-strong); }

  /* ---------------- TEKİL YAZI ---------------- */
  .article-head { margin-bottom: 40px; }
  .breadcrumb {
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
    font-size: 0.76rem; color: var(--ink-faint); margin-bottom: 22px;
  }
  .breadcrumb a { color: var(--ink-soft); text-decoration: none; }
  .breadcrumb a:hover { color: var(--navy); }
  .breadcrumb .crumb-sep { color: var(--line-strong); }

  .article-title {
    font-family: 'Fraunces', serif;
    font-weight: 600; font-size: clamp(2rem, 4.2vw, 3rem);
    line-height: 1.1; letter-spacing: -0.02em; color: var(--navy);
    margin-bottom: 22px;
  }
  .article-meta {
    display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
    font-size: 0.82rem; color: var(--ink-soft);
    padding-bottom: 26px; border-bottom: 1px solid var(--line);
  }
  .article-meta .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--line-strong); }
  .article-cover {
    width: 100%; aspect-ratio: 16/9; object-fit: cover;
    border-radius: 14px; margin: 30px 0 0;
    border: 1px solid var(--line);
  }

  /* ---- PROSE / makale gövdesi ---- */
  .prose {
    font-family: 'Newsreader', Georgia, serif;
    font-size: 1.15rem; line-height: 1.75; color: var(--ink);
    margin-top: 38px;
  }
  .prose > * + * { margin-top: 1.4em; }
  .prose h2 {
    font-family: 'Fraunces', serif; font-weight: 600;
    font-size: 1.7rem; line-height: 1.2; color: var(--navy);
    letter-spacing: -0.015em; margin-top: 2em; scroll-margin-top: 90px;
  }
  .prose h3 {
    font-family: 'Fraunces', serif; font-weight: 600;
    font-size: 1.32rem; color: var(--navy-2); margin-top: 1.6em; scroll-margin-top: 90px;
  }
  .prose p { color: var(--ink); }
  .prose a { color: var(--navy); text-decoration: underline; text-underline-offset: 3px; text-decoration-color: var(--amber-soft); }
  .prose a:hover { color: var(--amber); }
  .prose strong { font-weight: 600; color: var(--navy); }
  .prose ul, .prose ol { padding-left: 1.4em; }
  .prose li { margin-top: 0.5em; }
  .prose li::marker { color: var(--amber); }
  .prose blockquote {
    border-left: 3px solid var(--amber);
    padding: 6px 0 6px 22px; margin-left: 0;
    font-style: italic; color: var(--ink-soft);
    font-size: 1.18rem;
  }
  .prose code {
    font-family: 'IBM Plex Mono', monospace; font-size: 0.86em;
    background: var(--paper-2); padding: 2px 6px; border-radius: 4px;
    border: 1px solid var(--line);
  }
  .prose hr { border: none; border-top: 1px solid var(--line); margin: 2.4em 0; }
  .prose img { width: 100%; border-radius: 12px; border: 1px solid var(--line); }
  .prose table { width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif; font-size: 0.95rem; }
  .prose th, .prose td { border: 1px solid var(--line); padding: 10px 14px; text-align: left; }
  .prose th { background: var(--paper-2); font-weight: 600; color: var(--navy); }

  /* ---- Etiketler ---- */
  .tag-row { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 40px; }
  .tag {
    font-size: 0.74rem; font-weight: 500; color: var(--ink-soft);
    background: var(--surface); border: 1px solid var(--line-strong);
    padding: 6px 13px; border-radius: 999px;
  }

  /* ---- CTA kutusu (yazı sonu) ---- */
  .article-cta {
    margin-top: 52px; padding: 32px;
    background: var(--navy); border-radius: 16px; color: #fff;
    box-shadow: 0 30px 70px -40px rgba(15,42,74,0.6);
  }
  .article-cta h3 { font-family: 'Fraunces', serif; font-size: 1.5rem; font-weight: 600; margin-bottom: 10px; }
  .article-cta p { color: rgba(255,255,255,0.78); font-family: 'Newsreader', serif; font-size: 1.05rem; margin-bottom: 22px; }
  .article-cta a {
    display: inline-flex; align-items: center; gap: 8px;
    background: #f3d27a; color: var(--navy);
    font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.92rem;
    padding: 13px 26px; border-radius: 999px; text-decoration: none;
    transition: transform .16s ease, background .16s ease;
  }
  .article-cta a:hover { transform: translateY(-2px); background: #f7dd96; }

  /* ---- İlgili yazılar ---- */
  .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }

  /* ---------------- RESPONSIVE ---------------- */
  @media (max-width: 860px) {
    .post-featured { grid-template-columns: 1fr; }
    .post-featured .post-card-cover { min-height: 200px; }
    .blog-wrap { padding: 36px 16px 90px; }
    .blog-wrap-narrow { padding: 32px 18px 90px; }
    .blog-header-inner { padding: 14px 16px; }
    .prose { font-size: 1.08rem; }
  }
`;

export default function BlogTheme() {
  return <style dangerouslySetInnerHTML={{ __html: BLOG_CSS }} />;
}