import Image from "next/image";
import { formatEventDate } from "@/lib/events";
import { getUpcomingEvents } from "@/lib/publicData";

export const dynamic = "force-dynamic";

const TAG: Record<string, string> = {
  tryout: "TRYOUTS", match: "MATCH", tournament: "TOURNAMENT",
  team_building: "TEAM BUILDING", other: "EVENT",
};

export default async function Hero() {
  const heroEvents = await getUpcomingEvents(3);

  return (
    <section className="hero">
      <div className="hero__wrap">
        <div className="hero__frame">
          <Image
            src="/images/hero-team.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 1250px) 100vw, 1250px"
            className="hero__bg-img"
          />
          <div className="hero__bg-overlay" aria-hidden="true"></div>

          <div className="hero__content">
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
          </div>
        </div>

        <div className="hero__panel" role="group" aria-label="Upcoming events preview">
          <div className="hero__panel-head">
            <span className="dot" aria-hidden="true"></span>
            <span>upcoming_events.log</span>
          </div>
          <ul className="hero__panel-list">
            {heroEvents.length === 0 ? (
              <li className="hero__panel-empty">
                <span>Chưa có sự kiện nào sắp tới</span>
              </li>
            ) : (
              heroEvents.map((e) => (
                <li key={e.id}>
                  <span className="mono">{formatEventDate(e.event_date)}</span>
                  <span>{e.title}</span>
                  <span className="tag">{TAG[e.event_type] ?? "EVENT"}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
