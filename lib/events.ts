export type EventType = "tryout" | "match" | "tournament" | "team_building" | "other";
export type ParticipantStatus = "going" | "maybe" | "cancelled";

export interface ClubEventRow {
  id: string;
  title: string;
  slug: string;
  event_type: EventType;
  description: string | null;
  content: string | null;
  event_date: string | null;   // YYYY-MM-DD, null = TBA
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  allow_join: boolean;
  max_participants: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  member_id: string;
  joined_at: string;
  status: ParticipantStatus;
}

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  tryout: "Tuyển quân",
  match: "Trận đấu",
  tournament: "Giải đấu",
  team_building: "Team building",
  other: "Khác",
};

export const EVENT_TYPE_ORDER: EventType[] = [
  "tryout", "match", "tournament", "team_building", "other",
];

export const PARTICIPANT_LABEL: Record<ParticipantStatus, string> = {
  going: "Tham gia",
  maybe: "Có thể",
  cancelled: "Đã huỷ",
};

export const PARTICIPANT_ORDER: ParticipantStatus[] = ["going", "maybe", "cancelled"];

/**
 * Điều kiện hiện nút "Tham gia" ở trang công khai.
 * Khớp đúng policy INSERT của event_participants trong migration 006:
 * database chỉ nhận đăng ký khi sự kiện đã đăng VÀ đang mở nhận tham gia,
 * nên giao diện phải ẩn nút trong mọi trường hợp còn lại.
 */
export function canJoinEvent(event: Pick<ClubEventRow, "is_published" | "allow_join">): boolean {
  return event.is_published && event.allow_join;
}

/** Sự kiện đã đủ người chưa (max_participants null = không giới hạn). */
export function isEventFull(
  event: Pick<ClubEventRow, "max_participants">,
  goingCount: number
): boolean {
  return event.max_participants !== null && goingCount >= event.max_participants;
}

const DIACRITIC_MAP: Record<string, string> = { đ: "d", Đ: "D" };

/**
 * Sinh slug từ tiêu đề tiếng Việt.
 * Kết quả phải khớp ràng buộc ở database: ^[a-z0-9]+(-[a-z0-9]+)*$
 */
export function slugify(input: string): string {
  return input
    .replace(/[đĐ]/g, (c) => DIACRITIC_MAP[c])
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // bỏ dấu tiếng Việt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

const dateFmt = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatEventDate(date: string | null): string {
  if (!date) return "TBA";
  return dateFmt.format(new Date(`${date}T12:00:00`));
}

export function formatEventTime(start: string | null, end: string | null): string {
  if (!start) return "";
  const s = start.slice(0, 5);
  return end ? `${s} – ${end.slice(0, 5)}` : s;
}

const dateTimeFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatJoinedAt(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

export const EVENT_COLUMNS =
  "id, title, slug, event_type, description, content, event_date, start_time, end_time, location, cover_image_url, is_published, allow_join, max_participants, created_by, created_at, updated_at";
