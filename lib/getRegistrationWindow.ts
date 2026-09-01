import { createClient } from "./supabase/server";
import type { RegistrationType, RegistrationWindow } from "./registrationWindows";

const COLUMNS = "id, type, is_open, title, opens_at, closes_at, closed_message";

/** Đọc cấu hình một đợt. Trả null nếu chưa chạy migration hoặc chưa cấu hình Supabase. */
export async function getRegistrationWindow(
  type: RegistrationType
): Promise<RegistrationWindow | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("registration_windows")
      .select(COLUMNS)
      .eq("type", type)
      .single();
    return (data as RegistrationWindow) ?? null;
  } catch {
    return null;
  }
}

/** Đọc tất cả đợt — dùng cho trang chủ và trang cài đặt. */
export async function getAllRegistrationWindows(): Promise<RegistrationWindow[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("registration_windows")
      .select(COLUMNS)
      .order("type");
    return (data as RegistrationWindow[]) ?? [];
  } catch {
    return [];
  }
}
