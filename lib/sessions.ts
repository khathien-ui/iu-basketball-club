export type AttendanceStatus = "present" | "late" | "excused" | "absent";

export interface TrainingSession {
  id: string;
  title: string;
  session_date: string;      // YYYY-MM-DD
  start_time: string;        // HH:MM:SS
  end_time: string | null;
  location: string | null;
  checkin_code: string;
  checkin_opens_at: string | null;
  checkin_closes_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  note: string | null;
}

export interface Attendance {
  id: string;
  session_id: string;
  member_id: string;
  checked_in_at: string | null;
  status: AttendanceStatus;
  marked_by: string | null;
  note: string | null;
}

export type SessionState = "upcoming" | "open" | "closed";

export const STATE_LABEL: Record<SessionState, string> = {
  upcoming: "Sắp tới",
  open: "Đang mở check-in",
  closed: "Đã đóng",
};

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  present: "Có mặt",
  late: "Đi trễ",
  excused: "Có phép",
  absent: "Vắng",
};

export const ATTENDANCE_ORDER: AttendanceStatus[] = ["present", "late", "excused", "absent"];

/** Cùng logic với hàm check_in_with_code() trong migration 005. */
export function sessionState(s: TrainingSession, now = Date.now()): SessionState {
  if (!s.is_active) return "closed";
  if (s.checkin_opens_at && new Date(s.checkin_opens_at).getTime() > now) return "upcoming";
  if (s.checkin_closes_at && new Date(s.checkin_closes_at).getTime() <= now) return "closed";
  return "open";
}

const dateFmt = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatSessionDate(dateStr: string): string {
  // Ghép giữa trưa để tránh lệch ngày khi đổi múi giờ.
  return dateFmt.format(new Date(`${dateStr}T12:00:00`));
}

/** "18:00:00" -> "18:00" */
export function formatTime(t: string | null): string {
  if (!t) return "";
  return t.slice(0, 5);
}

export function formatRange(start: string, end: string | null): string {
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

const clockFmt = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit", minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatClock(iso: string | null): string {
  return iso ? clockFmt.format(new Date(iso)) : "—";
}

/**
 * Ghép ngày + giờ theo giờ máy người dùng rồi đổi sang ISO.
 * Admin tạo buổi tập ở Việt Nam nên giờ máy chính là giờ buổi tập.
 */
export function combineToIso(dateStr: string, timeStr: string, offsetMinutes = 0): string | null {
  if (!dateStr || !timeStr) return null;
  const d = new Date(`${dateStr}T${timeStr.slice(0, 5)}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + offsetMinutes * 60_000).toISOString();
}

/** ISO -> chuỗi cho <input type="datetime-local"> theo giờ máy. */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Đếm ngược dạng "1:23:45" hoặc "5:03". */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export const WEEKDAYS = [
  { value: 1, label: "Thứ Hai" },
  { value: 2, label: "Thứ Ba" },
  { value: 3, label: "Thứ Tư" },
  { value: 4, label: "Thứ Năm" },
  { value: 5, label: "Thứ Sáu" },
  { value: 6, label: "Thứ Bảy" },
  { value: 0, label: "Chủ Nhật" },
];

/** Các ngày (YYYY-MM-DD) rơi vào thứ đã chọn, trong `weeks` tuần kể từ `fromDate`. */
export function weeklyDates(fromDate: string, weekday: number, weeks: number): string[] {
  const start = new Date(`${fromDate}T12:00:00`);
  if (Number.isNaN(start.getTime())) return [];

  // Ngày đầu tiên rơi đúng thứ cần, tính từ fromDate trở đi.
  const delta = (weekday - start.getDay() + 7) % 7;
  const first = new Date(start.getTime() + delta * 86_400_000);

  const out: string[] = [];
  for (let i = 0; i < weeks; i++) {
    const d = new Date(first.getTime() + i * 7 * 86_400_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    out.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }
  return out;
}
