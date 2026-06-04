// components/blog/BlogHeader.jsx
import Link from "next/link";

export function BlogHeader() {
  return (
    <header className="blog-header">
      <div className="blog-header-inner">
        <Link href="/blog" className="brand">
          <span className="brand-mark">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </span>
          <span>
            <span className="brand-name">Consülto Blog</span>
            <span className="brand-sub">Hukuk · İçtihat · Uygulama</span>
          </span>
        </Link>
        <Link href="/" className="nav-back">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Ana Sayfa
        </Link>
      </div>
    </header>
  );
}