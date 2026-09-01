import { events } from "@/data/events";
import { getAllRegistrationWindows } from "@/lib/getRegistrationWindow";
import { isWindowOpen, type RegistrationType } from "@/lib/registrationWindows";

export const dynamic = "force-dynamic";

export default async function EventsList() {
  const windows = await getAllRegistrationWindows();
  const openByType = new Map<RegistrationType, boolean>(
    windows.map((w) => [w.type, isWindowOpen(w)])
  );

  return (
    <section className="section" id="events">
      <div className="section-inner">
        <p className="eyebrow">Bước lên sân</p>
        <h2 className="section__title">Upcoming Events.</h2>

        <div className="events-list">
          {events.map(({ name, desc, tag, action, href, external, note, gate, date }) => {
            // Nút có gate chỉ bấm được khi đợt tương ứng đang mở.
            const locked = !!gate && !openByType.get(gate);

            return (
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
                  {locked ? (
                    <span className="btn btn--ghost is-locked" aria-disabled="true">
                      Sắp mở
                    </span>
                  ) : (
                    <a
                      href={href}
                      className="btn btn--ghost"
                      {...(external ? { target: "_blank", rel: "noopener" } : {})}
                    >
                      {action}
                    </a>
                  )}
                  {note && <span className="event-row__note">{note}</span>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
