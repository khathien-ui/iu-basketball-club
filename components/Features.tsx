export default function Features() {
  return (
    <section className="section" id="features">
      <div className="section-inner">
        <p className="eyebrow">Nền tảng của CLB</p>
        <h2 className="section__title">One platform, three pillars.</h2>

        <div className="grid-3">
          <article className="card">
            <div className="card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <h3>Portal</h3>
            <p>Cổng thông tin công khai của CLB — chúng tôi là ai, ban điều hành, và mọi thông báo quan trọng.</p>
          </article>

          <article className="card">
            <div className="card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4.5 20c1-3.6 4-5.5 7.5-5.5s6.5 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3>Member Management</h3>
            <p>Đội hình, vai trò và hồ sơ của cầu thủ lẫn ban điều hành — với khu vực riêng dành cho thành viên.</p>
          </article>

          <article className="card">
            <div className="card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3.5 9.5h17M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3>Events &amp; Media</h3>
            <p>Tổ chức giải đấu, đăng ký tuyển quân, và thư viện ảnh lưu giữ mọi ngày thi đấu.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
