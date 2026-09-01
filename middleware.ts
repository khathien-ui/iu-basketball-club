import { NextResponse, type NextRequest } from "next/server";
import { updateSession, redirectKeepingCookies } from "@/lib/supabase/middleware";

const STAFF_ROLES = ["admin", "executive_board"];

/** Khu vực chỉ dành cho admin và executive_board. */
const STAFF_PATHS = ["/dashboard/admin", "/dashboard/recruits", "/dashboard/settings"];

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

  if (!pathname.startsWith("/dashboard")) {
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

  // Khu vực quản trị: chỉ admin và executive_board.
  if (STAFF_PATHS.some((p) => pathname.startsWith(p))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

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
