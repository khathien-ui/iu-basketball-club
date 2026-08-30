import { events } from "@/data/events";

export default function EventsList() {
  return (
    <section className="section" id="events">
      <div className="section-inner">
        <p className="eyebrow">Bước lên sân</p>
        <h2 className="section__title">Upcoming Events.</h2>

        <div className="events-list">
          {events.map(({ name, desc, tag, action, href, external, note, date }) => (
            <article className="event-row" key={name}>
              <div className="event-row__date">
                <span className="mono">{date}</span>
              </div>
              <div className="event-row__body">
                <h4>{name}</h4>
                <p>{desc}</p>
              </div>
              <span className="tag">{tag}</span>
              <div className="event-row__action">
                <a
                  href={href}
                  className="btn btn--ghost"
                  {...(external ? { target: "_blank", rel: "noopener" } : {})}
                >
                  {action}
                </a>
                {note && <span className="event-row__note">{note}</span>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
