import {
  ATTENDANCE_LABEL,
  formatClock,
  formatRange,
  formatSessionDate,
  type AttendanceStatus,
} from "@/lib/sessions";
import { formatRate, rateLevel } from "@/lib/attendanceStats";

export interface MyAttendanceRow {
  id: string;
  checked_in_at: string | null;
  status: AttendanceStatus;
  created_at: string;
  training_sessions: {
    title: string;
    session_date: string;
    start_time: string;
    location: string | null;
  } | null;
}

interface Props {
  monthLabel: string;
  totalSessions: number;
  attended: number;
  late: number;
  excused: number;
  absent: number;
  rate: number | null;
  history: MyAttendanceRow[];
}

/** Khối chuyên cần của chính thành viên, hiển thị trong /dashboard/profile. */
export default function MyAttendance({
  monthLabel, totalSessions, attended, late, excused, absent, rate, history,
}: Props) {
  return (
    <section className="form-card profile-card">
      <h2 className="profile-card__title">Chuyên cần {monthLabel}</h2>

      {totalSessions === 0 ? (
        <p className="field__hint">
          Chưa có buổi tập nào trong tháng này. Chỉ số chuyên cần sẽ hiện khi CLB
          bắt đầu các buổi tập.
        </p>
      ) : (
        <>
          <div className="my-att">
            <div className="my-att__rate">
              <span className={`my-att__value mono${rate !== null ? ` rate--${rateLevel(rate)}` : ""}`}>
                {formatRate(rate)}
              </span>
              <span className="my-att__label">{attended}/{totalSessions} buổi có mặt</span>
            </div>
            <div className="my-att__breakdown">
              <div><span className="mono">{late}</span><span>Đi trễ</span></div>
              <div><span className="mono">{excused}</span><span>Có phép</span></div>
              <div><span className="mono">{absent}</span><span>Vắng</span></div>
            </div>
          </div>

          {rate !== null && (
            <div className="rate-bar" aria-hidden="true">
              <span className={`rate-bar__fill rate--${rateLevel(rate)}`}
                style={{ width: `${Math.round(rate)}%` }} />
            </div>
          )}
        </>
      )}

      <h3 className="drawer__subtitle">Lịch sử check-in gần đây</h3>

      {history.length === 0 ? (
        <p className="field__hint">Bạn chưa điểm danh buổi tập nào.</p>
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
  );
}
