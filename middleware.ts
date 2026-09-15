import { NextResponse, type NextRequest } from "next/server";
import { updateSession, redirectKeepingCookies } from "@/lib/supabase/middleware";

const STAFF_ROLES = ["admin", "executive_board"];

/** Khu vực chỉ dành cho admin và executive_board. */
const STAFF_PATHS = [
  "/dashboard/admin",
  "/dashboard/recruits",
  "/dashboard/settings",
  "/dashboard/members",
  "/dashboard/sessions",
];

const CHANGE_PASSWORD_PATH = "/dashboard/change-password";

/** Khu vực yêu cầu đăng nhập: cùng áp dụng khoá tài khoản và ép đổi mật khẩu. */
const MEMBER_AREA = ["/dashboard", "/checkin"];

export async function middleware(request: NextRequest) {
  // Chưa cấu hình Supabase → cho qua, tránh middleware sập làm chết cả site.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  const { supabase, response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!MEMBER_AREA.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return response;
  }

  // Chưa đăng nhập → về /login, nhớ đường dẫn để quay lại sau khi đăng nhập.
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return redirectKeepingCookies(url, response);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active, must_change_password")
    .eq("id", user.id)
    .single();

  // Tài khoản bị khoá → đăng xuất và đá về trang đăng nhập.
  if (profile && !profile.is_active) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("error", "locked");
    return redirectKeepingCookies(url, response);
  }

  // Đang dùng mật khẩu tạm → ép đổi mật khẩu trước, chặn mọi trang khác.
  if (profile?.must_change_password && pathname !== CHANGE_PASSWORD_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = CHANGE_PASSWORD_PATH;
    url.search = "";
    return redirectKeepingCookies(url, response);
  }

  // Đã đổi rồi mà còn vào trang đổi mật khẩu bắt buộc → về dashboard.
  if (!profile?.must_change_password && pathname === CHANGE_PASSWORD_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return redirectKeepingCookies(url, response);
  }

  // Khu vực quản trị: chỉ admin và executive_board.
  if (STAFF_PATHS.some((p) => pathname.startsWith(p))) {
    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return redirectKeepingCookies(url, response);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Chạy trên mọi route trừ file tĩnh và ảnh, để session luôn được làm mới.
     */
    "/((?!_next/static|_next/image|favicon.ico|assets|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
