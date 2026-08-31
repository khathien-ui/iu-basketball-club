import Footer from "./Footer";

interface Props {
  eyebrow: string;
  title: string;
  lede: string;
  children: React.ReactNode;
}

/** Khung chung cho các trang xác thực: logo CLB + tiêu đề + nội dung. */
export default function AuthShell({ eyebrow, title, lede, children }: Props) {
  return (
    <>
      <main className="page auth-page">
        <section className="section section--first">
          <div className="section-inner auth-inner">
            <a href="/" className="auth-logo" aria-label="Về trang chủ">
              <img src="/assets/logo.png" alt="IU Basketball Club" />
            </a>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="section__title">{title}</h1>
            <p className="section__lede">{lede}</p>
            {children}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
