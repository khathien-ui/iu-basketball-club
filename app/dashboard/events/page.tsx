import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventsAdmin from "@/components/EventsAdmin";
import { isMediaRole } from "@/lib/members";
import { EVENT_COLUMNS, type ClubEventRow } from "@/lib/events";

export const metadata: Metadata = {
  title: "Sự kiện — IU Basketball Club",
};

export const dynamic = "force-dynamic";

export default async function EventsAdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/events");

  // Cho cả admin, executive_board và media — khớp public.is_media_manager().
  const { data: me } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!me || !me.is_active || !isMediaRole(me.role)) redirect("/dashboard");

  const { data: eventRows, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const events = (eventRows ?? []) as ClubEventRow[];

  // Số người đã nhận tham gia (chỉ tính 'going', bỏ 'maybe' và 'cancelled').
  const goingCounts: Record<string, number> = {};
  if (events.length > 0) {
    const { data: rows } = await supabase
      .from("event_participants")
      .select("event_id")
      .in("event_id", events.map((e) => e.id))
      .eq("status", "going");

    for (const row of rows ?? []) {
      goingCounts[row.event_id] = (goingCounts[row.event_id] ?? 0) + 1;
    }
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <p className="eyebrow">Quản trị</p>
            <h1 className="section__title">Events.</h1>
            <p className="section__lede">
              Tạo và quản lý sự kiện của CLB. Sự kiện mới luôn ở dạng nháp
              cho tới khi bạn bấm đăng.
            </p>

            {error ? (
              <p className="form-alert" role="alert">
                Không tải được danh sách sự kiện: {error.message}
              </p>
            ) : (
              <EventsAdmin initialEvents={events} goingCounts={goingCounts} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
