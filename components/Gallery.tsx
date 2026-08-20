export default function Gallery() {
  return (
    <section className="section" id="gallery">
      <div className="section-inner">
        <p className="eyebrow">Ngày thi đấu</p>
        <h2 className="section__title">Gallery.</h2>
        <p className="section__lede">
          Hình ảnh và khoảnh khắc nổi bật từ các buổi tuyển quân, tập luyện và giải đấu.
        </p>

        <div className="gallery-grid">
          <div className="gallery-tile gallery-tile--lg"></div>
          <div className="gallery-tile"></div>
          <div className="gallery-tile"></div>
          <div className="gallery-tile"></div>
          <div className="gallery-tile"></div>
        </div>
      </div>
    </section>
  );
}
