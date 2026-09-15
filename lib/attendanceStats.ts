import type { Profile, UserRole } from "./members";
import type { Attendance, AttendanceStatus, TrainingSession } from "./sessions";

export type PeriodKind = "this_month" | "last_month" | "custom";

export interface Period {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export const PERIOD_LABEL: Record<PeriodKind, string> = {
  this_month: "Tháng này",
  last_month: "Tháng trước",
  custom: "Tuỳ chọn",
};

function ymd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayYmd(): string {
  return ymd(new Date());
}

export function periodFor(kind: PeriodKind, now = new Date()): Period {
  if (kind === "last_month") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: ymd(first), to: ymd(last) };
  }
  // this_month: từ đầu tháng tới hôm nay
  return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: ymd(now) };
}

export interface MemberStats {
  member: Profile;
  /** Số buổi được tính cho thành viên này (đã trừ buổi trước khi họ vào CLB). */
  totalSessions: number;
  present: number;
  late: number;
  excused: number;
  /** Vắng không phép = buổi tính − có mặt − có phép. */
  absent: number;
  /** present + late */
  attended: number;
  /** null khi không có buổi nào để tính. */
  rate: number | null;
}

export type RateLevel = "good" | "warn" | "bad";

/** Ngưỡng màu: xanh ≥80%, vàng 50–80%, đỏ <50%. */
export function rateLevel(rate: number): RateLevel {
  if (rate >= 80) return "good";
  if (rate >= 50) return "warn";
  return "bad";
}

/**
 * Buổi tập được tính vào kỳ thống kê.
 * Chỉ lấy buổi ĐÃ DIỄN RA: buổi trong tương lai của tháng này mà tính là
 * vắng thì tỉ lệ của mọi người sẽ tụt oan giữa tháng.
 */
export function sessionsInPeriod(
  sessions: TrainingSession[],
  period: Period,
  today = todayYmd()
): TrainingSession[] {
  const to = period.to < today ? period.to : today;
  return sessions
    .filter((s) => s.session_date >= period.from && s.session_date <= to)
    .sort((a, b) => b.session_date.localeCompare(a.session_date));
}

/** Trạng thái của một thành viên ở một buổi; null = không có bản ghi (vắng không phép). */
export function statusOf(
  attendances: Attendance[],
  sessionId: string,
  memberId: string
): AttendanceStatus | null {
  const a = attendances.find((x) => x.session_id === sessionId && x.member_id === memberId);
  return a ? a.status : null;
}

/**
 * Buổi tập chỉ tính cho thành viên nếu diễn ra sau khi họ có tài khoản —
 * người mới vào tuần này không nên bị tính vắng các buổi từ tháng trước.
 */
function countsForMember(session: TrainingSession, member: Profile): boolean {
  return session.session_date >= member.created_at.slice(0, 10);
}

export function computeStats(
  members: Profile[],
  sessions: TrainingSession[],
  attendances: Attendance[]
): MemberStats[] {
  const byMember = new Map<string, Map<string, AttendanceStatus>>();
  for (const a of attendances) {
    if (!byMember.has(a.member_id)) byMember.set(a.member_id, new Map());
    byMember.get(a.member_id)!.set(a.session_id, a.status);
  }

  return members.map((member) => {
    const records = byMember.get(member.id);
    let totalSessions = 0;
    let present = 0, late = 0, excused = 0, absent = 0;

    for (const s of sessions) {
      if (!countsForMember(s, member)) continue;
      totalSessions++;

      switch (records?.get(s.id)) {
        case "present": present++; break;
        case "late": late++; break;
        case "excused": excused++; break;
        case "absent": absent++; break;
        default: absent++; break; // không có bản ghi = vắng không phép
      }
    }

    const attended = present + late;
    return {
      member, totalSessions, present, late, excused, absent, attended,
      rate: totalSessions > 0 ? (attended / totalSessions) * 100 : null,
    };
  });
}

export interface Overview {
  averageRate: number | null;
  sessionCount: number;
  top5: MemberStats[];
}

export function overviewOf(stats: MemberStats[], sessionCount: number): Overview {
  const rated = stats.filter((s) => s.rate !== null);
  const averageRate = rated.length
    ? rated.reduce((sum, s) => sum + (s.rate ?? 0), 0) / rated.length
    : null;

  const top5 = [...rated]
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0) || b.attended - a.attended)
    .slice(0, 5);

  return { averageRate, sessionCount, top5 };
}

export function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate)}%`;
}

export const ROLE_FILTER_ALL = "all" as const;
export type RoleFilter = UserRole | typeof ROLE_FILTER_ALL;
