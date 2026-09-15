import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionDetail from "@/components/SessionDetail";
import { isStaffRole, type Profile } from "@/lib/members";
import type { Attendance, TrainingSession } from "@/lib/sessions";

export const metadata: Metadata = {
  title: "Chi tiết buổi tập — IU Basketball Club",
};

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/sessions/${params.id}`);

  const { data: me } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!me || !me.is_active || !isStaffRole(me.role)) redirect("/dashboard");

  const { data: session } = await supabase
    .from("training_sessions")
    .select(
      "id, title, session_date, start_time, end_time, location, checkin_code, checkin_opens_at, checkin_closes_at, is_active, created_by, created_at, note"
    )
    .eq("id", params.id)
    .single();

  if (!session) notFound();

  const [{ data: memberRows }, { data: attendanceRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, student_id, email, phone, role, position, height_cm, joined_year, avatar_url, is_active, must_change_password, created_at"
      )
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("attendances")
      .select("id, session_id, member_id, checked_in_at, status, marked_by, note")
      .eq("session_id", params.id),
  ]);

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <SessionDetail
              initialSession={session as TrainingSession}
              members={(memberRows ?? []) as Profile[]}
              initialAttendances={(attendanceRows ?? []) as Attendance[]}
              currentUserId={user.id}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
