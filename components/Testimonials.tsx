const QUOTES = [
  {
    quote:
      '"Tham gia CLB là quyết định đúng đắn nhất năm nhất của mình. Đến vì bóng rổ, ở lại vì một gia đình."',
    author: "Thành viên CLB",
  },
  {
    quote:
      '"Buổi tuyển quân rất thân thiện kể cả với người mới. Các anh chị coach quan tâm nỗ lực trước, kỹ năng sau."',
    author: "Tân binh",
  },
  {
    quote:
      '"Cùng ban điều hành tổ chức giải 3x3 dạy mình nhiều điều hơn bất kỳ lớp học nào."',
    author: "Thành viên ban điều hành",
  },
];

export default function Testimonials() {
  return (
    <section className="section" id="voices">
      <div className="section-inner">
        <p className="eyebrow">Từ sân đấu</p>
        <h2 className="section__title">What members say.</h2>

        <div className="grid-3">
          {QUOTES.map(({ quote, author }) => (
            <figure className="card quote-card" key={author}>
              <blockquote>{quote}</blockquote>
              <figcaption>
                <span className="quote-card__avatar" aria-hidden="true"></span>
                <span>
                  <strong>{author}</strong>
                  <em>Placeholder — thay bằng cảm nhận thật</em>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
