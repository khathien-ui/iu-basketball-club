export type RegistrationType = "tryout" | "tournament";

export interface RegistrationWindow {
  id: string;
  type: RegistrationType;
  is_open: boolean;
  title: string | null;
  opens_at: string | null;
  closes_at: string | null;
  closed_message: string | null;
}

export const WINDOW_LABEL: Record<RegistrationType, string> = {
  tryout: "Tuyển quân",
  tournament: "Giải đấu 3x3",
};

/** Tiêu đề màn hình khi đợt đang đóng. */
export const CLOSED_TITLE: Record<RegistrationType, string> = {
  tryout: "Tuyển quân chưa mở",
  tournament: "Đăng ký giải đấu chưa mở",
};

export const DEFAULT_CLOSED_MESSAGE =
  "Đợt đăng ký hiện chưa mở. Hãy theo dõi fanpage của CLB để nhận thông báo sớm nhất.";

/**
 * Cùng logic với hàm public.is_registration_open() trong migration 003.
 * Đợt chỉ mở khi được bật thủ công VÀ đang nằm trong khoảng thời gian.
 */
export function isWindowOpen(w: RegistrationWindow | null | undefined): boolean {
  if (!w || !w.is_open) return false;
  const now = Date.now();
  if (w.opens_at && new Date(w.opens_at).getTime() > now) return false;
  if (w.closes_at && new Date(w.closes_at).getTime() <= now) return false;
  return true;
}

/** Đợt chưa tới ngày mở (khác với đã đóng hẳn). */
export function opensInFuture(w: RegistrationWindow | null | undefined): boolean {
  if (!w?.opens_at) return false;
  return new Date(w.opens_at).getTime() > Date.now();
}

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** ISO -> chuỗi cho <input type="datetime-local"> theo giờ máy người dùng. */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Chuỗi từ <input type="datetime-local"> -> ISO (null nếu bỏ trống). */
export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
