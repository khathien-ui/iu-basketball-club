import { news } from "@/data/news";

export default function News() {
  return (
    <section className="section" id="news">
      <div className="section-inner">
        <p className="eyebrow">Mới nhất</p>
        <h2 className="section__title">News.</h2>

        <div className="grid-3">
          {news.map(({ title, desc, date }) => (
            <article className="card news-card" key={title}>
              <span className="mono news-card__date">{date}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
