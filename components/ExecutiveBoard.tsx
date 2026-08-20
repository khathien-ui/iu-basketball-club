const BOARD = [
  { role: "President", desc: "Định hướng CLB & đối ngoại" },
  { role: "Vice President", desc: "Vận hành & hậu cần" },
  { role: "Head Coach", desc: "Huấn luyện & tuyển chọn đội hình" },
  { role: "Media Lead", desc: "Nội dung & truyền thông" },
];

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
          {BOARD.map(({ role, desc }) => (
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
