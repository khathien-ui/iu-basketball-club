import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegistrationClosed from "@/components/RegistrationClosed";
import TeamSignupForm, { type TournamentOption } from "@/components/TeamSignupForm";
import { getRegistrationWindow } from "@/lib/getRegistrationWindow";
import { isWindowOpen } from "@/lib/registrationWindows";
import { getUpcomingEventsByType } from "@/lib/publicData";
import { MAX_MEMBERS, MIN_MEMBERS } from "@/lib/teams";

export const metadata: Metadata = {
  title: "Đăng ký giải 3x3 — IU Basketball Club",
  description:
    "Đăng ký đội tham gia giải bóng rổ 3x3 của CLB Bóng rổ IU — Trường Đại học Quốc tế, ĐHQG TP.HCM.",
};

// Trạng thái đợt đổi theo thời gian nên không được cache tĩnh.
export const dynamic = "force-dynamic";

export default async function TournamentSignupPage() {
  const window = await getRegistrationWindow("tournament");
  const open = isWindowOpen(window);

  // Chỉ tải danh sách giải khi đợt đang mở — form đóng thì không cần.
  const tournaments: TournamentOption[] = open
    ? (await getUpcomingEventsByType("tournament")).map((e) => ({
        id: e.id,
        title: e.title,
        event_date: e.event_date,
      }))
    : [];

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
                  Đăng ký đội tham gia giải 3x3 của CLB Bóng rổ IU. Mỗi đội gồm{" "}
                  {MIN_MEMBERS}–{MAX_MEMBERS} vận động viên, trong đó có một đội trưởng
                  đứng ra liên hệ với ban tổ chức.
                </p>
                {window?.title && <p className="batch-chip mono">Đợt: {window.title}</p>}
                {tournaments.length === 1 && (
                  <p className="batch-chip mono">Giải: {tournaments[0].title}</p>
                )}
                <TeamSignupForm tournaments={tournaments} />
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
