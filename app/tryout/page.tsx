import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TryoutForm from "@/components/TryoutForm";

export const metadata: Metadata = {
  title: "Đăng ký tuyển quân — IU Basketball Club",
  description:
    "Đăng ký tham gia tuyển quân CLB Bóng rổ IU — Trường Đại học Quốc tế, ĐHQG TP.HCM. Mở cho mọi sinh viên, không cần kinh nghiệm.",
};

export default function TryoutPage() {
  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner section-inner--narrow">
            <p className="eyebrow">Bước lên sân</p>
            <h1 className="section__title">Tryout Registration.</h1>
            <p className="section__lede">
              Điền thông tin bên dưới để đăng ký tham gia tuyển quân cùng CLB Bóng rổ IU.
              Tuyển quân mở cho mọi sinh viên — không cần kinh nghiệm, chỉ cần bạn xuất hiện.
            </p>

            <TryoutForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
