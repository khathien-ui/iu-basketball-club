const POSTS = [
  {
    title: "Sắp mở đăng ký tuyển quân",
    desc: "Chi tiết cách đăng ký cho mùa giải sắp tới sẽ được cập nhật tại đây.",
  },
  {
    title: "Công bố ban điều hành mới",
    desc: "Gặp gỡ những sinh viên dẫn dắt CLB trong năm nay.",
  },
  {
    title: "Lịch giải đấu đang được hoàn thiện",
    desc: "Theo dõi trang Facebook của CLB để nhận thông tin mới nhất.",
  },
];

export default function News() {
  return (
    <section className="section" id="news">
      <div className="section-inner">
        <p className="eyebrow">Mới nhất</p>
        <h2 className="section__title">News.</h2>

        <div className="grid-3">
          {POSTS.map(({ title, desc }) => (
            <article className="card news-card" key={title}>
              <span className="mono news-card__date">TBA</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
