export interface AlbumRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  event_id: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  album_date: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PhotoRow {
  id: string;
  album_id: string;
  image_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  sort_order: number;
  uploaded_by: string | null;
  created_at: string;
}

export const ALBUM_COLUMNS =
  "id, title, slug, description, event_id, cover_image_url, is_published, album_date, created_by, created_at";

export const PHOTO_COLUMNS =
  "id, album_id, image_url, thumbnail_url, caption, sort_order, uploaded_by, created_at";

const dateFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatAlbumDate(date: string | null): string {
  if (!date) return "—";
  return dateFmt.format(new Date(`${date}T12:00:00`));
}

/** Năm dùng làm hậu tố ưu tiên khi slug bị trùng. */
export function albumYear(date: string | null): number | null {
  if (!date) return null;
  const y = Number(date.slice(0, 4));
  return Number.isInteger(y) ? y : null;
}
