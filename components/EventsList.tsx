import { events } from "@/data/events";

export default function EventsList() {
  return (
    <section className="section" id="events">
      <div className="section-inner">
        <p className="eyebrow">Bước lên sân</p>
        <h2 className="section__title">Upcoming Events.</h2>

        <div className="events-list">
          {events.map(({ name, desc, tag, action, date }) => (
            <article className="event-row" key={name}>
              <div className="event-row__date">
                <span className="mono">{date}</span>
              </div>
              <div className="event-row__body">
                <h4>{name}</h4>
                <p>{desc}</p>
              </div>
              <span className="tag">{tag}</span>
              <a href="#contact" className="btn btn--ghost">{action}</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
