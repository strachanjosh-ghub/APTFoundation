'use client';
import Link from 'next/link';
import { useState } from 'react';

type Item = { id: string; title: string; path: string; image?: string; author?: string; date: string; excerpt: string };

/** News listing with the source site's previous/next pagination ("You are currently on page X of Y"). */
export function NewsFeed({ items, pageSize, showPagination }: { items: Item[]; pageSize: number; showPagination: boolean }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const visible = items.slice((page - 1) * pageSize, page * pageSize);
  return (
    <div>
      <ul className="card-grid" aria-live="polite">
        {visible.map((a) => (
          <li key={a.id}>
            <article className="card">
              {a.image ? (
                <Link href={a.path} className="card__media" tabIndex={-1} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.image} alt="" loading="lazy" />
                </Link>
              ) : null}
              <div className="card__body">
                <h3 className="card__title"><Link href={a.path}>{a.title}</Link></h3>
                <span className="card__meta">{[a.author, a.date].filter(Boolean).join(' · ')}</span>
                <p className="card__text">{a.excerpt}</p>
                <Link href={a.path} className="card__more" aria-label={`Read more: ${a.title}`}>Read more</Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
      {showPagination && pages > 1 ? (
        <nav className="pagination" aria-label="News pages">
          <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page === 1} aria-label="Previous page">‹</button>
          <p style={{ margin: 0 }}>You are currently on page {page} of {pages}</p>
          <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page === pages} aria-label="Next page">›</button>
        </nav>
      ) : null}
    </div>
  );
}
