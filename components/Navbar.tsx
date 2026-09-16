import { createClient } from "@/lib/supabase/server";
import NavbarClient from "./NavbarClient";
import { isMediaRole, isStaffRole } from "@/lib/members";

/**
 * Server Component: đọc session để Navbar hiện đúng trạng thái đăng nhập
 * ngay từ lần render đầu (không bị nháy nút "Member Login").
 */
export default async function Navbar() {
  let displayName: string | null = null;
  let isStaff = false;
  let canManageContent = false;

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
      isStaff = isStaffRole(profile?.role);
      canManageContent = isMediaRole(profile?.role);
    }
  } catch {
    // Supabase chưa cấu hình — site vẫn chạy ở chế độ khách.
  }

  return (
    <NavbarClient
      displayName={displayName}
      isStaff={isStaff}
      canManageContent={canManageContent}
    />
  );
}
