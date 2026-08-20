import { testimonials } from "@/data/testimonials";

export default function Testimonials() {
  return (
    <section className="section" id="voices">
      <div className="section-inner">
        <p className="eyebrow">Từ sân đấu</p>
        <h2 className="section__title">What members say.</h2>

        <div className="grid-3">
          {testimonials.map(({ quote, author, note }) => (
            <figure className="card quote-card" key={author}>
              <blockquote>{quote}</blockquote>
              <figcaption>
                <span className="quote-card__avatar" aria-hidden="true"></span>
                <span>
                  <strong>{author}</strong>
                  <em>{note}</em>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
