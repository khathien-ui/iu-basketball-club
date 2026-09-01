import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegistrationClosed from "@/components/RegistrationClosed";
import { getRegistrationWindow } from "@/lib/getRegistrationWindow";
import { isWindowOpen } from "@/lib/registrationWindows";

export const metadata: Metadata = {
  title: "Đăng ký giải 3x3 — IU Basketball Club",
  description: "Đăng ký đội tham gia giải bóng rổ 3x3 của CLB Bóng rổ IU.",
};

export const dynamic = "force-dynamic";

const FANPAGE = "https://www.facebook.com/IUBASKETBALLL";

export default async function TournamentSignupPage() {
  const window = await getRegistrationWindow("tournament");
  const open = isWindowOpen(window);

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner section-inner--narrow">
            <p className="eyebrow">Giải đấu</p>
            <h1 className="section__title">Tournament Registration.</h1>

            {open ? (
              <>
                <p className="section__lede">
                  Đăng ký đội tham gia giải 3x3 của CLB Bóng rổ IU.
                </p>
                {window?.title && (
                  <p className="batch-chip mono">Đợt: {window.title}</p>
                )}
                {/*
                  Form đăng ký đội (tên đội, đội trưởng, 3-5 thành viên) là hạng mục
                  riêng trong ROADMAP Giai đoạn 5 — cần bảng teams + team_members.
                  Trong lúc chờ, đợt mở sẽ dẫn người dùng qua fanpage.
                */}
                <div className="form-card form-done">
                  <h2>Đợt đăng ký đang mở</h2>
                  <p>
                    Form đăng ký đội đang được hoàn thiện. Trong thời gian này, vui lòng
                    liên hệ ban điều hành qua fanpage để đăng ký đội của bạn.
                  </p>
                  <div className="form-done__actions">
                    <a href={FANPAGE} target="_blank" rel="noopener" className="btn btn--solid btn--lg">
                      Đăng ký qua fanpage
                    </a>
                    <a href="/" className="btn btn--ghost btn--lg">Về trang chủ</a>
                  </div>
                </div>
              </>
            ) : (
              <RegistrationClosed type="tournament" window={window} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
