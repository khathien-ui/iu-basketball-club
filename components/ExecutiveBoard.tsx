import { board } from "@/data/board";

export default function ExecutiveBoard() {
  return (
    <section className="section" id="board">
      <div className="section-inner">
        <p className="eyebrow">Ai vận hành</p>
        <h2 className="section__title">Executive Board.</h2>
        <p className="section__lede">
          Gặp gỡ những sinh viên đứng sau các buổi tuyển quân, giải đấu và mọi hoạt động của CLB.
        </p>

        <div className="grid-4">
          {board.map(({ role, desc }) => (
            <article className="board-card" key={role}>
              <div className="board-card__avatar" aria-hidden="true"></div>
              <h4>{role}</h4>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
