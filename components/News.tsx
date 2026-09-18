import EmptyState from "./EmptyState";
import { formatPostDate, POST_CATEGORY_LABEL } from "@/lib/posts";
import { getPublishedPosts } from "@/lib/publicData";

export const dynamic = "force-dynamic";

export default async function News() {
  const posts = (await getPublishedPosts(3)).slice(0, 3);

  return (
    <section className="section" id="news">
      <div className="section-inner">
        <p className="eyebrow">Mới nhất</p>
        <h2 className="section__title">News.</h2>

        {posts.length === 0 ? (
          <EmptyState
            title="Chưa có tin tức nào"
            message="Tường thuật trận đấu, thông báo và thành tích của CLB sẽ được đăng tại đây."
          />
        ) : (
          <>
            <div className="grid-3">
              {posts.map((p) => (
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

            <p className="section-more">
              <a href="/news" className="link-arrow">
                Xem tất cả tin tức <span aria-hidden="true">→</span>
              </a>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
