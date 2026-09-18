"use client";

import { useMemo, useState } from "react";
import {
  formatPostDate,
  POST_CATEGORY_LABEL,
  POST_CATEGORY_ORDER,
  type PostCategory,
  type PostRow,
} from "@/lib/posts";

interface Props {
  posts: PostRow[];
}

export default function NewsBrowser({ posts }: Props) {
  const [category, setCategory] = useState<PostCategory | "all">("all");

  const filtered = useMemo(
    () => posts.filter((p) => category === "all" || p.category === category),
    [posts, category]
  );

  return (
    <div className="news-browser">
      <div className="filter-chips" role="group" aria-label="Lọc theo chuyên mục">
        <button
          type="button"
          className={`chip${category === "all" ? " is-active" : ""}`}
          onClick={() => setCategory("all")}
        >
          Tất cả
        </button>
        {POST_CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip${category === c ? " is-active" : ""}`}
            onClick={() => setCategory(c)}
          >
            {POST_CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="field__hint browser-empty">Chưa có bài viết nào trong chuyên mục này.</p>
      ) : (
        <div className="grid-3">
          {filtered.map((p) => (
            <a key={p.id} href={`/news/${p.slug}`} className="card news-card news-card--link">
              {p.cover_image_url && (
                <span className="news-card__cover">
                  <img src={p.cover_image_url} alt="" loading="lazy" />
                </span>
              )}
              <span className="mono news-card__date">
                {p.published_at ? formatPostDate(p.published_at) : "—"}
              </span>
              <h3>{p.title}</h3>
              {p.excerpt && <p>{p.excerpt}</p>}
              <span className="news-card__cat">{POST_CATEGORY_LABEL[p.category]}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
