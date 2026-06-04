// components/blog/PostCard.jsx
import Link from "next/link";
import { formatDateTR } from "@/lib/blog";

export function PostCard({ post, featured = false }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`post-card${featured ? " post-featured" : ""}`}
    >
      <div className="post-card-cover">
        {post.cover ? (
          <img src={post.cover} alt={post.title} loading="lazy" />
        ) : (
          <span className="post-card-cover-fallback">§</span>
        )}
      </div>
      <div className="post-card-body">
        <div className="post-cat">{post.category}</div>
        <h2 className="post-card-title">{post.title}</h2>
        <p className="post-card-desc">{post.description}</p>
        <div className="post-meta">
          <span>{formatDateTR(post.date)}</span>
          <span className="sep" />
          <span>{post.readingTime.text}</span>
        </div>
      </div>
    </Link>
  );
}