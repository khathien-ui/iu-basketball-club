export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="section-inner footer__inner">
        <div className="footer__brand">
          <a href="/" className="nav__logo">
            <span className="nav__logo-badge">
              <img src="/assets/logo.png" alt="IU Basketball Club logo" />
            </span>
            IU Basketball Club
          </a>
          <p>
            Trường Đại học Quốc tế — ĐHQG TP.HCM
            <br />
            TP. Hồ Chí Minh, Việt Nam
          </p>
        </div>

        <div className="footer__col">
          <h5>Club</h5>
          <a href="/#about">About Us</a>
          <a href="/#board">Executive Board</a>
          <a href="#">Members</a>
        </div>

        <div className="footer__col">
          <h5>Explore</h5>
          <a href="/events">Events</a>
          <a href="/gallery">Gallery</a>
          <a href="/news">News</a>
        </div>

        <div className="footer__col">
          <h5>Connect</h5>
          <a href="https://www.facebook.com/IUBASKETBALLL" target="_blank" rel="noopener">
            Facebook
          </a>
          <a href="/#contact">Contact</a>
        </div>
      </div>

      <div className="section-inner footer__bottom">
        <p>© 2026 CLB Bóng rổ IU — IU Basketball Club. Bảo lưu mọi quyền.</p>
      </div>
    </footer>
  );
}
