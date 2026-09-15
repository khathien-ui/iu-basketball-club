import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionsList from "@/components/SessionsList";
import { isStaffRole } from "@/lib/members";
import type { TrainingSession } from "@/lib/sessions";

export const metadata: Metadata = {
  title: "Buổi tập — IU Basketball Club",
};

export const dynamic = "force-dynamic";

const SESSION_COLUMNS =
  "id, title, session_date, start_time, end_time, location, checkin_code, checkin_opens_at, checkin_closes_at, is_active, created_by, created_at, note";

export default async function SessionsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/sessions");

  const { data: me } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!me || !me.is_active || !isStaffRole(me.role)) redirect("/dashboard");

  const { data: sessionRows, error } = await supabase
    .from("training_sessions")
    .select(SESSION_COLUMNS)
    .order("session_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(100);

  const sessions = (sessionRows ?? []) as TrainingSession[];

  // Đếm số người thực sự có mặt cho từng buổi.
  // Chỉ tính present + late: "có phép" và "vắng" không phải là đã check-in,
  // nếu tính vào sẽ lệch với con số ở trang chi tiết.
  const counts: Record<string, number> = {};
  if (sessions.length > 0) {
    const { data: rows } = await supabase
      .from("attendances")
      .select("session_id")
      .in("session_id", sessions.map((s) => s.id))
      .in("status", ["present", "late"]);

    for (const row of rows ?? []) {
      counts[row.session_id] = (counts[row.session_id] ?? 0) + 1;
    }
  }

  const { count: activeMembers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <p className="eyebrow">Quản trị</p>
            <h1 className="section__title">Training Sessions.</h1>
            <p className="section__lede">
              Tạo buổi tập, chiếu mã điểm danh tại sân và theo dõi ai đã có mặt.
            </p>

            {error ? (
              <p className="form-alert" role="alert">
                Không tải được danh sách buổi tập: {error.message}
              </p>
            ) : (
              <SessionsList
                initialSessions={sessions}
                checkinCounts={counts}
                activeMembers={activeMembers ?? 0}
              />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
