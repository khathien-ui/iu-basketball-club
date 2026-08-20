export default function About() {
  return (
    <section className="section section--split" id="about">
      <div className="section-inner">
        <div className="split">
          <div className="split__text">
            <p className="eyebrow">Về câu lạc bộ</p>
            <h2 className="section__title">One court, one roster, one purpose.</h2>
            <p className="split__body">
              CLB Bóng rổ IU là nơi hội tụ của cầu thủ, ban tổ chức và người hâm mộ
              đến từ Trường Đại học Quốc tế — ĐHQG TP.HCM. Từ những buổi tuyển quân
              mở đến các giải đấu trong khuôn viên trường, CLB tồn tại để mọi sinh viên
              đều có con đường bước lên sân và trở thành một phần của đội.
            </p>
            <a
              href="https://www.facebook.com/IUBASKETBALLL"
              target="_blank"
              rel="noopener"
              className="link-arrow"
            >
              Theo dõi CLB trên Facebook <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="split__stats">
            <div className="stat">
              <span className="stat__value mono">IU</span>
              <span className="stat__label">Trường Đại học Quốc tế</span>
            </div>
            <div className="stat">
              <span className="stat__value mono">VNU-HCM</span>
              <span className="stat__label">Đại học Quốc gia TP.HCM</span>
            </div>
            <div className="stat">
              <span className="stat__value mono">HCMC</span>
              <span className="stat__label">Hoạt động tại TP. Hồ Chí Minh</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
