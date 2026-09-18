import type { RecruitPosition } from "./recruits";

export type TeamStatus = "pending" | "approved" | "rejected";

/** Số vận động viên tối thiểu / tối đa một đội — khớp hàm register_team(). */
export const MIN_MEMBERS = 3;
export const MAX_MEMBERS = 5;

export interface TeamMemberRow {
  id: string;
  team_id: string;
  full_name: string;
  student_id: string;
  phone: string | null;
  height_cm: number | null;
  position: RecruitPosition;
  is_captain: boolean;
  sort_order: number;
  created_at: string;
}

export interface TeamRow {
  id: string;
  tournament_event_id: string | null;
  team_name: string;
  team_code: string;
  captain_name: string;
  captain_student_id: string;
  captain_email: string;
  captain_phone: string;
  status: TeamStatus;
  note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

/** Đội kèm đội hình và tên giải — dạng dùng ở trang quản trị. */
export interface TeamWithMembers extends TeamRow {
  members: TeamMemberRow[];
  event_title: string | null;
}

export const TEAM_COLUMNS =
  "id, tournament_event_id, team_name, team_code, captain_name, captain_student_id, " +
  "captain_email, captain_phone, status, note, reviewed_at, reviewed_by, created_at";

export const TEAM_MEMBER_COLUMNS =
  "id, team_id, full_name, student_id, phone, height_cm, position, is_captain, sort_order, created_at";

export const TEAM_STATUS_LABEL: Record<TeamStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

export const TEAM_STATUS_ORDER: TeamStatus[] = ["pending", "approved", "rejected"];

/** Một dòng thành viên trong form đăng ký (mọi trường là chuỗi từ input). */
export interface MemberDraft {
  full_name: string;
  student_id: string;
  phone: string;
  height_cm: string;
  position: string;
  is_captain: boolean;
}

export function emptyMember(): MemberDraft {
  return {
    full_name: "",
    student_id: "",
    phone: "",
    height_cm: "",
    position: "",
    is_captain: false,
  };
}

export type MemberErrors = Partial<Record<keyof MemberDraft, string>>;

/** Chuẩn hoá MSSV để so trùng — cùng quy tắc với upper(btrim()) ở database. */
export function normalizeStudentId(value: string): string {
  return value.trim().toUpperCase();
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Validate một dòng thành viên.
 * Chỉ kiểm tra trong phạm vi một người; trùng MSSV giữa các dòng do
 * findDuplicateStudentIds() lo, còn trùng với đội khác thì chỉ database
 * biết nên để hàm register_team() trả lỗi về.
 */
export function validateMember(m: MemberDraft): MemberErrors {
  const e: MemberErrors = {};

  if (!m.full_name.trim()) e.full_name = "Nhập họ và tên.";
  if (!m.student_id.trim()) e.student_id = "Nhập MSSV.";

  const phone = digitsOnly(m.phone);
  if (m.phone.trim() && phone.length !== 10) {
    e.phone = "Số điện thoại phải có đúng 10 số.";
  }

  if (m.height_cm.trim()) {
    const h = Number(m.height_cm);
    if (!Number.isFinite(h) || h < 100 || h > 250) {
      e.height_cm = "Chiều cao phải từ 100 đến 250 cm.";
    }
  }

  return e;
}

/**
 * Trả về các MSSV xuất hiện nhiều hơn một lần trong cùng đội.
 * Dùng chung với kiểm tra 'duplicate_in_team' ở database, nhưng chạy trước
 * để người dùng thấy lỗi ngay mà không phải gửi form.
 */
export function findDuplicateStudentIds(members: MemberDraft[]): Set<string> {
  const seen = new Map<string, number>();
  for (const m of members) {
    const id = normalizeStudentId(m.student_id);
    if (!id) continue;
    seen.set(id, (seen.get(id) ?? 0) + 1);
  }
  const dupes = new Set<string>();
  seen.forEach((count, id) => { if (count > 1) dupes.add(id); });
  return dupes;
}

/** Payload gửi cho hàm register_team() — khoá phải khớp đúng tên hàm đọc. */
export function toRpcMembers(members: MemberDraft[]) {
  return members.map((m) => ({
    full_name: m.full_name.trim(),
    student_id: m.student_id.trim(),
    phone: digitsOnly(m.phone) || null,
    height_cm: m.height_cm.trim() || null,
    position: m.position || "unknown",
    is_captain: m.is_captain,
  }));
}

/** Kết quả hàm register_team() trả về. */
export interface RegisterTeamResult {
  success: boolean;
  code: string;
  message: string;
  team_id?: string;
  team_code?: string;
  team_name?: string;
  member_count?: number;
  student_id?: string;
}

const dateTimeFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatTeamDate(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

/** Đội trưởng trong đội hình, fallback về dòng đầu nếu dữ liệu cũ thiếu cờ. */
export function captainOf(members: TeamMemberRow[]): TeamMemberRow | null {
  return members.find((m) => m.is_captain) ?? members[0] ?? null;
}
