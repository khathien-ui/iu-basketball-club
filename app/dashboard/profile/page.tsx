import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileForm from "@/components/ProfileForm";
import MyAttendance, { type MyAttendanceRow } from "@/components/MyAttendance";
import type { Profile } from "@/lib/members";
import type { Attendance, TrainingSession } from "@/lib/sessions";
import { computeStats, periodFor, sessionsInPeriod, todayYmd } from "@/lib/attendanceStats";

export const metadata: Metadata = {
  title: "Hồ sơ của tôi — IU Basketball Club",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/profile");

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, student_id, email, phone, role, position, height_cm, joined_year, avatar_url, is_active, must_change_password, created_at"
    )
    .eq("id", user.id)
    .single();

  const profile = data as Profile | null;

  // ---- Chuyên cần tháng này + lịch sử check-in của chính thành viên ----
  const period = periodFor("this_month");
  const monthLabel = `tháng ${new Date().getMonth() + 1}`;

  const [{ data: sessionRows }, { data: historyRows }] = await Promise.all([
    supabase
      .from("training_sessions")
      .select(
        "id, title, session_date, start_time, end_time, location, checkin_code, checkin_opens_at, checkin_closes_at, is_active, created_by, created_at, note"
      )
      .gte("session_date", period.from)
      .lte("session_date", period.to),
    supabase
      .from("attendances")
      .select(
        "id, checked_in_at, status, created_at, session_id, member_id, marked_by, note, training_sessions(title, session_date, start_time, location)"
      )
      .eq("member_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const monthSessions = sessionsInPeriod(
    (sessionRows ?? []) as TrainingSession[],
    period,
    todayYmd()
  );

  // Bản ghi điểm danh của riêng mình trong các buổi của tháng.
  let myAttendances: Attendance[] = [];
  if (profile && monthSessions.length > 0) {
    const { data: mine } = await supabase
      .from("attendances")
      .select("id, session_id, member_id, checked_in_at, status, marked_by, note")
      .eq("member_id", user.id)
      .in("session_id", monthSessions.map((s) => s.id));
    myAttendances = (mine ?? []) as Attendance[];
  }

  const myStats = profile
    ? computeStats([profile], monthSessions, myAttendances)[0]
    : null;

  const history = (historyRows ?? []) as unknown as MyAttendanceRow[];

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner section-inner--narrow">
            <p className="eyebrow">Khu vực thành viên</p>
            <h1 className="section__title">My Profile.</h1>
            <p className="section__lede">
              Xem thông tin thành viên của bạn, cập nhật số điện thoại, ảnh đại diện
              và đổi mật khẩu.
            </p>

            {error || !profile ? (
              <p className="form-alert" role="alert">
                Không tải được hồ sơ của bạn
                {error ? `: ${error.message}` : "."}
              </p>
            ) : (
              <>
                <ProfileForm profile={profile} />
                {myStats && (
                  <div className="profile">
                    <MyAttendance
                      monthLabel={monthLabel}
                      totalSessions={myStats.totalSessions}
                      attended={myStats.attended}
                      late={myStats.late}
                      excused={myStats.excused}
                      absent={myStats.absent}
                      rate={myStats.rate}
                      history={history}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
