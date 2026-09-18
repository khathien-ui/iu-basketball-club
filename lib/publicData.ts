import { createClient } from "./supabase/server";
import { EVENT_COLUMNS, type ClubEventRow } from "./events";
import { POST_COLUMNS, type PostRow } from "./posts";
import { ALBUM_COLUMNS, PHOTO_COLUMNS, type AlbumRow, type PhotoRow } from "./albums";

/**
 * Truy vấn dữ liệu công khai cho các trang ngoài dashboard.
 *
 * Mọi hàm đều nuốt lỗi và trả về giá trị rỗng: nếu Supabase chưa cấu hình
 * hoặc migration chưa chạy thì trang vẫn hiển thị trạng thái rỗng tử tế
 * thay vì đổ lỗi 500 ra người xem.
 */

function todayYmd(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Sự kiện chưa diễn ra (ngày >= hôm nay) hoặc chưa chốt ngày (TBA). */
export function isUpcoming(event: Pick<ClubEventRow, "event_date">, today = todayYmd()): boolean {
  return !event.event_date || event.event_date >= today;
}

/** Sắp tới: gần nhất trước, sự kiện chưa có ngày (TBA) xếp cuối. */
export function sortUpcoming(a: ClubEventRow, b: ClubEventRow): number {
  if (!a.event_date && !b.event_date) return a.title.localeCompare(b.title, "vi");
  if (!a.event_date) return 1;
  if (!b.event_date) return -1;
  return a.event_date.localeCompare(b.event_date);
}

/** Đã diễn ra: mới nhất trước. */
export function sortPast(a: ClubEventRow, b: ClubEventRow): number {
  return (b.event_date ?? "").localeCompare(a.event_date ?? "");
}

// ============================================================
// Sự kiện
// ============================================================

export async function getPublishedEvents(): Promise<ClubEventRow[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("events")
      .select(EVENT_COLUMNS)
      .eq("is_published", true)
      .limit(300);
    return (data ?? []) as ClubEventRow[];
  } catch {
    return [];
  }
}

export async function getUpcomingEvents(limit = 3): Promise<ClubEventRow[]> {
  const all = await getPublishedEvents();
  const today = todayYmd();
  return all.filter((e) => isUpcoming(e, today)).sort(sortUpcoming).slice(0, limit);
}

export async function getEventBySlug(slug: string): Promise<ClubEventRow | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("events")
      .select(EVENT_COLUMNS)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    return (data as ClubEventRow) ?? null;
  } catch {
    return null;
  }
}

/** Số người đã nhận tham gia (chỉ tính 'going'). */
export async function getGoingCount(eventId: string): Promise<number> {
  try {
    const supabase = createClient();
    const { count } = await supabase
      .from("event_participants")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "going");
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Trạng thái tham gia của người đang đăng nhập, null nếu chưa đăng ký. */
export async function getMyParticipation(
  eventId: string,
  userId: string
): Promise<"going" | "maybe" | "cancelled" | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("event_participants")
      .select("status")
      .eq("event_id", eventId)
      .eq("member_id", userId)
      .maybeSingle();
    return (data?.status as "going" | "maybe" | "cancelled") ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// Bài viết
// ============================================================

export async function getPublishedPosts(limit = 200): Promise<PostRow[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("posts")
      .select(POST_COLUMNS)
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as PostRow[];
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<PostRow | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("posts")
      .select(POST_COLUMNS)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    return (data as PostRow) ?? null;
  } catch {
    return null;
  }
}

export async function getAuthorName(authorId: string | null): Promise<string | null> {
  if (!authorId) return null;
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", authorId)
      .maybeSingle();
    return data?.full_name?.trim() || null;
  } catch {
    return null;
  }
}

// ============================================================
// Album ảnh
// ============================================================

export async function getPublishedAlbums(): Promise<AlbumRow[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("albums")
      .select(ALBUM_COLUMNS)
      .eq("is_published", true)
      .order("album_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(200);
    return (data ?? []) as AlbumRow[];
  } catch {
    return [];
  }
}

export async function getAlbumBySlug(slug: string): Promise<AlbumRow | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("albums")
      .select(ALBUM_COLUMNS)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    return (data as AlbumRow) ?? null;
  } catch {
    return null;
  }
}

export async function getAlbumPhotos(albumId: string, limit = 500): Promise<PhotoRow[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("photos")
      .select(PHOTO_COLUMNS)
      .eq("album_id", albumId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(limit);
    return (data ?? []) as PhotoRow[];
  } catch {
    return [];
  }
}

/** Đếm ảnh cho nhiều album một lượt. */
export async function getPhotoCounts(albumIds: string[]): Promise<Record<string, number>> {
  if (albumIds.length === 0) return {};
  try {
    const supabase = createClient();
    const { data } = await supabase.from("photos").select("album_id").in("album_id", albumIds);
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.album_id] = (counts[row.album_id] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

/** Ảnh cho lưới masonry ở trang chủ, lấy từ các album đã đăng. */
export async function getGalleryPhotos(limit = 6): Promise<PhotoRow[]> {
  const albums = await getPublishedAlbums();
  if (albums.length === 0) return [];
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("photos")
      .select(PHOTO_COLUMNS)
      .in("album_id", albums.map((a) => a.id))
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as PhotoRow[];
  } catch {
    return [];
  }
}

/** Album gắn với một sự kiện (nếu có). */
export async function getAlbumForEvent(eventId: string): Promise<AlbumRow | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("albums")
      .select(ALBUM_COLUMNS)
      .eq("event_id", eventId)
      .eq("is_published", true)
      .order("album_date", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    return (data as AlbumRow) ?? null;
  } catch {
    return null;
  }
}

/** Người đang đăng nhập, null nếu là khách. */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}
