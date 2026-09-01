import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TryoutForm from "@/components/TryoutForm";
import RegistrationClosed from "@/components/RegistrationClosed";
import { getRegistrationWindow } from "@/lib/getRegistrationWindow";
import { isWindowOpen } from "@/lib/registrationWindows";

export const metadata: Metadata = {
  title: "Đăng ký tuyển quân — IU Basketball Club",
  description:
    "Đăng ký tham gia tuyển quân CLB Bóng rổ IU — Trường Đại học Quốc tế, ĐHQG TP.HCM. Mở cho mọi sinh viên, không cần kinh nghiệm.",
};

// Trạng thái đợt đổi theo thời gian nên không được cache tĩnh.
export const dynamic = "force-dynamic";

export default async function TryoutPage() {
  const window = await getRegistrationWindow("tryout");
  const open = isWindowOpen(window);

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner section-inner--narrow">
            <p className="eyebrow">Bước lên sân</p>
            <h1 className="section__title">Tryout Registration.</h1>

            {open ? (
              <>
                <p className="section__lede">
                  Điền thông tin bên dưới để đăng ký tham gia tuyển quân cùng CLB Bóng rổ IU.
                  Tuyển quân mở cho mọi sinh viên — không cần kinh nghiệm, chỉ cần bạn xuất hiện.
                </p>
                {window?.title && (
                  <p className="batch-chip mono">Đợt: {window.title}</p>
                )}
                <TryoutForm />
              </>
            ) : (
              <RegistrationClosed type="tryout" window={window} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
