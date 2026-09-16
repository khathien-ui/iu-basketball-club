import type { SupabaseClient } from "@supabase/supabase-js";

/** Bảng có cột slug unique — dùng chung cho events, posts, albums. */
export type SlugTable = "events" | "posts" | "albums";

/** Slug dài nhất, khớp giới hạn cắt trong slugify(). */
const MAX_SLUG_LENGTH = 80;

/** Số hậu tố số thử trong một lần truy vấn trước khi mở rộng phạm vi. */
const BATCH_SIZE = 20;

export interface SlugQuery {
  table: SlugTable;
  /** Slug gốc sinh từ tiêu đề, đã qua slugify(). */
  base: string;
  /** Năm ưu tiên thêm vào khi slug gốc bị trùng (VD 2026). */
  year?: number | null;
  /** Bỏ qua chính bản ghi đang sửa khi kiểm tra trùng. */
  excludeId?: string | null;
}

/** Cắt bớt phần gốc để gốc + hậu tố không vượt quá giới hạn. */
function fit(base: string, suffix: string): string {
  const room = MAX_SLUG_LENGTH - suffix.length;
  return (room >= base.length ? base : base.slice(0, Math.max(1, room)))
    .replace(/-+$/, "") + suffix;
}

/**
 * Danh sách slug ứng viên theo thứ tự ưu tiên:
 *   base  ->  base-YYYY  ->  base-YYYY-2, -3, …
 * Không có năm thì bỏ qua bước giữa: base -> base-2, -3, …
 */
export function slugCandidates(
  base: string,
  year: number | null | undefined,
  from: number,
  to: number
): string[] {
  const out: string[] = [];
  if (from <= 1) {
    out.push(base);
    if (year) out.push(fit(base, `-${year}`));
  }
  const stem = year ? fit(base, `-${year}`) : base;
  for (let i = Math.max(2, from); i <= to; i++) {
    out.push(fit(stem, `-${i}`));
  }
  return out;
}

/** Những slug trong danh sách đã bị bản ghi khác chiếm. */
async function takenAmong(
  supabase: SupabaseClient,
  { table, excludeId }: Pick<SlugQuery, "table" | "excludeId">,
  candidates: string[]
): Promise<Set<string>> {
  let query = supabase.from(table).select("slug").in("slug", candidates);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw error;
  return new Set((data ?? []).map((r: { slug: string }) => r.slug));
}

export async function isSlugTaken(
  supabase: SupabaseClient,
  { table, excludeId }: Pick<SlugQuery, "table" | "excludeId">,
  slug: string
): Promise<boolean> {
  const taken = await takenAmong(supabase, { table, excludeId }, [slug]);
  return taken.has(slug);
}

/**
 * Tìm slug khả dụng gần nhất theo thứ tự ưu tiên ở slugCandidates().
 * Mỗi vòng chỉ tốn một truy vấn cho tối đa BATCH_SIZE ứng viên.
 */
export async function findAvailableSlug(
  supabase: SupabaseClient,
  { table, base, year, excludeId }: SlugQuery
): Promise<string> {
  if (!base) return "";

  for (let round = 0; round < 5; round++) {
    const from = round === 0 ? 1 : round * BATCH_SIZE + 1;
    const to = (round + 1) * BATCH_SIZE;
    const candidates = slugCandidates(base, year, from, to);
    if (candidates.length === 0) continue;

    const taken = await takenAmong(supabase, { table, excludeId }, candidates);
    const free = candidates.find((c) => !taken.has(c));
    if (free) return free;
  }

  // Cực hiếm: hơn 100 bản ghi cùng slug gốc. Dùng hậu tố thời gian cho chắc.
  return fit(base, `-${Date.now().toString(36)}`);
}

/** Lỗi trùng slug trả về từ Postgres (23505 = unique_violation). */
export function isSlugConflict(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return e?.code === "23505" && /slug/i.test(e.message ?? "");
}

export interface WriteResult<T> {
  data: T | null;
  /** Slug thực sự được lưu — có thể khác slug ban đầu nếu phải né tranh chấp. */
  slug: string;
}

/**
 * Ghi bản ghi có slug, tự né tranh chấp.
 *
 * Kiểm tra trước khi lưu vẫn có thể thua nếu hai người bấm lưu cùng lúc:
 * người kia chiếm slug giữa lúc mình kiểm tra và lúc mình ghi. Khi đó
 * database trả 23505; ta lặng lẽ xin slug mới rồi ghi lại thay vì ném lỗi
 * ra cho người dùng.
 */
export async function writeWithUniqueSlug<T>(
  supabase: SupabaseClient,
  query: SlugQuery,
  initialSlug: string,
  perform: (slug: string) => Promise<{ data: T | null; error: unknown }>,
  maxAttempts = 4
): Promise<WriteResult<T>> {
  let slug = initialSlug;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await perform(slug);
    if (!error) return { data, slug };
    if (!isSlugConflict(error)) throw error;

    console.warn(`[slug] Tranh chấp slug "${slug}", thử lại lần ${attempt + 1}.`);
    const next = await findAvailableSlug(supabase, query);
    // findAvailableSlug vừa thấy slug kia đã bị chiếm nên phải trả giá trị khác.
    slug = next === slug ? fit(query.base, `-${Date.now().toString(36)}`) : next;
  }

  throw new Error("Không tìm được slug khả dụng sau nhiều lần thử.");
}
