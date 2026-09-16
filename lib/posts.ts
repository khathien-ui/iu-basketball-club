export type PostCategory = "recap" | "announcement" | "achievement" | "other";

export interface PostRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  category: PostCategory;
  is_published: boolean;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export const POST_CATEGORY_LABEL: Record<PostCategory, string> = {
  recap: "Tường thuật",
  announcement: "Thông báo",
  achievement: "Thành tích",
  other: "Khác",
};

export const POST_CATEGORY_ORDER: PostCategory[] = [
  "recap", "announcement", "achievement", "other",
];

/** Giới hạn mềm cho đoạn tóm tắt hiện ở trang chủ. */
export const EXCERPT_LIMIT = 200;

export const POST_COLUMNS =
  "id, title, slug, excerpt, content, cover_image_url, category, is_published, published_at, author_id, created_at, updated_at";

const dateTimeFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatPostDate(iso: string | null): string {
  return iso ? dateTimeFmt.format(new Date(iso)) : "—";
}

const clockFmt = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatClockTime(date: Date): string {
  return clockFmt.format(date);
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
