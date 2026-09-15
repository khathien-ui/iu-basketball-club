import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckinForm from "@/components/CheckinForm";
import {
  ATTENDANCE_LABEL,
  formatClock,
  formatRange,
  formatSessionDate,
  type AttendanceStatus,
} from "@/lib/sessions";

export const metadata: Metadata = {
  title: "Điểm danh — IU Basketball Club",
};

export const dynamic = "force-dynamic";

interface HistoryRow {
  id: string;
  checked_in_at: string | null;
  status: AttendanceStatus;
  marked_by: string | null;
  created_at: string;
  training_sessions: {
    title: string;
    session_date: string;
    start_time: string;
    location: string | null;
  } | null;
}

export default async function CheckinPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkin");

  // RLS cho phép thành viên đọc đúng bản ghi của mình.
  const { data: historyRows } = await supabase
    .from("attendances")
    .select(
      "id, checked_in_at, status, marked_by, created_at, training_sessions(title, session_date, start_time, location)"
    )
    .eq("member_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const history = (historyRows ?? []) as unknown as HistoryRow[];

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner section-inner--narrow">
            <p className="eyebrow">Khu vực thành viên</p>
            <h1 className="section__title">Check-in.</h1>
            <p className="section__lede">
              Nhập mã 6 số được chiếu tại sân để điểm danh buổi tập.
            </p>

            <CheckinForm />

            <section className="checkin-history">
              <h2 className="profile-card__title">Lịch sử điểm danh gần đây</h2>

              {history.length === 0 ? (
                <p className="field__hint">
                  Bạn chưa điểm danh buổi tập nào. Lịch sử sẽ hiện ở đây sau lần check-in đầu tiên.
                </p>
              ) : (
                <ul className="history-list">
                  {history.map((h) => (
                    <li key={h.id} className="history-item">
                      <div className="history-item__main">
                        <strong>{h.training_sessions?.title ?? "Buổi tập đã xoá"}</strong>
                        <span className="history-item__meta">
                          {h.training_sessions
                            ? `${formatSessionDate(h.training_sessions.session_date)} · ${formatRange(h.training_sessions.start_time, null)}`
                            : "—"}
                          {h.training_sessions?.location ? ` · ${h.training_sessions.location}` : ""}
                        </span>
                      </div>
                      <div className="history-item__side">
                        <span className={`att-chip att-chip--${h.status}`}>
                          {ATTENDANCE_LABEL[h.status]}
                        </span>
                        <span className="history-item__time mono">
                          {h.checked_in_at ? formatClock(h.checked_in_at) : "—"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
