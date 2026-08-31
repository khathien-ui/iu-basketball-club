import { createClient } from "@/lib/supabase/server";
import NavbarClient from "./NavbarClient";

const STAFF_ROLES = ["admin", "executive_board"];

/**
 * Server Component: đọc session để Navbar hiện đúng trạng thái đăng nhập
 * ngay từ lần render đầu (không bị nháy nút "Member Login").
 */
export default async function Navbar() {
  let displayName: string | null = null;
  let isStaff = false;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      displayName = profile?.full_name?.trim() || user.email || "Thành viên";
      isStaff = !!profile && STAFF_ROLES.includes(profile.role);
    }
  } catch {
    // Supabase chưa cấu hình — site vẫn chạy ở chế độ khách.
  }

  return <NavbarClient displayName={displayName} isStaff={isStaff} />;
}
