import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Đích đến của liên kết trong email Supabase gửi (đặt lại mật khẩu, mời tài khoản).
 * Đổi mã PKCE trong URL thành session cookie rồi chuyển tiếp người dùng.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Liên kết hỏng hoặc hết hạn — để trang reset-password hiện thông báo tiếng Việt.
  return NextResponse.redirect(`${origin}/reset-password?error=invalid_link`);
}
