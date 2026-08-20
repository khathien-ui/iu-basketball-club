export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__glow" aria-hidden="true"></div>
      <div className="hero__grid" aria-hidden="true"></div>

      <div className="section-inner hero__inner">
        <div className="hero__emblem">
          <img src="/assets/logo.png" alt="IU Basketball Club emblem" />
        </div>
        <div className="hero__divider" aria-hidden="true"></div>
        <p className="eyebrow">International University · VNU-HCM</p>
        <h1 className="hero__title">
          Built for the team.<br />Run like a club.
        </h1>
        <p className="hero__subtitle">
          Ngôi nhà chính thức của CLB Bóng rổ IU — tin tức, tuyển quân, giải đấu
          và quản lý thành viên cho mọi cầu thủ trong đội hình.
        </p>
        <div className="hero__cta">
          <a href="#events" className="btn btn--solid btn--lg">View Upcoming Events</a>
          <a href="#about" className="btn btn--ghost btn--lg">About the Club</a>
        </div>

        <div className="hero__panel" role="group" aria-label="Upcoming events preview">
          <div className="hero__panel-head">
            <span className="dot" aria-hidden="true"></span>
            <span>upcoming_events.log</span>
          </div>
          <ul className="hero__panel-list">
            <li>
              <span className="mono">TBA</span>
              <span>Tuyển quân mùa Thu — Mở đăng ký</span>
              <span className="tag">TRYOUTS</span>
            </li>
            <li>
              <span className="mono">TBA</span>
              <span>Trận mở màn mùa giải vs. TBD</span>
              <span className="tag">MATCH</span>
            </li>
            <li>
              <span className="mono">TBA</span>
              <span>Giải đấu 3x3 IU</span>
              <span className="tag">TOURNAMENT</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
