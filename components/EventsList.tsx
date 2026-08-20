const EVENTS = [
  {
    name: "Fall Tryouts",
    desc: "Mở đăng ký cho toàn bộ sinh viên IU — không cần kinh nghiệm vẫn có thể thử sức.",
    tag: "TRYOUTS",
    action: "Register",
  },
  {
    name: "Season Opener",
    desc: "Trận mở màn mùa giải — địa điểm và đối thủ sẽ được công bố sau.",
    tag: "MATCH",
    action: "Details",
  },
  {
    name: "IU 3x3 Tournament",
    desc: "Giải 3x3 toàn trường, mở đăng ký cho các đội sinh viên.",
    tag: "TOURNAMENT",
    action: "Register a Team",
  },
];

export default function EventsList() {
  return (
    <section className="section" id="events">
      <div className="section-inner">
        <p className="eyebrow">Bước lên sân</p>
        <h2 className="section__title">Upcoming Events.</h2>

        <div className="events-list">
          {EVENTS.map(({ name, desc, tag, action }) => (
            <article className="event-row" key={name}>
              <div className="event-row__date">
                <span className="mono">TBA</span>
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
