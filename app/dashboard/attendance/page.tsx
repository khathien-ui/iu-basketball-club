import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AttendanceReport from "@/components/AttendanceReport";
import { isStaffRole, type Profile } from "@/lib/members";
import type { Attendance, TrainingSession } from "@/lib/sessions";

export const metadata: Metadata = {
  title: "Chuyên cần — IU Basketball Club",
};

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/attendance");

  const { data: me } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!me || !me.is_active || !isStaffRole(me.role)) redirect("/dashboard");

  // Lấy toàn bộ dữ liệu một lần rồi lọc theo kỳ ở phía client — quy mô CLB nhỏ,
  // đổi kỳ thống kê sẽ tức thì mà không phải gọi lại máy chủ.
  const [{ data: memberRows }, { data: sessionRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, student_id, email, phone, role, position, height_cm, joined_year, avatar_url, is_active, must_change_password, created_at"
      )
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("training_sessions")
      .select(
        "id, title, session_date, start_time, end_time, location, checkin_code, checkin_opens_at, checkin_closes_at, is_active, created_by, created_at, note"
      )
      .order("session_date", { ascending: false })
      .limit(500),
  ]);

  const sessions = (sessionRows ?? []) as TrainingSession[];

  let attendances: Attendance[] = [];
  if (sessions.length > 0) {
    const { data } = await supabase
      .from("attendances")
      .select("id, session_id, member_id, checked_in_at, status, marked_by, note")
      .in("session_id", sessions.map((s) => s.id));
    attendances = (data ?? []) as Attendance[];
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <p className="eyebrow">Quản trị</p>
            <h1 className="section__title">Attendance Report.</h1>
            <p className="section__lede">
              Tỉ lệ chuyên cần của từng thành viên theo kỳ thống kê.
            </p>

            <AttendanceReport
              members={(memberRows ?? []) as Profile[]}
              sessions={sessions}
              attendances={attendances}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
