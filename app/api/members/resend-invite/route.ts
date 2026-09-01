import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTempPassword } from "@/lib/password";
import { sendWelcomeEmail } from "@/lib/email/sendWelcomeEmail";
import { isStaffRole } from "@/lib/members";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Sinh mật khẩu tạm MỚI cho thành viên chưa đổi mật khẩu rồi gửi lại email. */
export async function POST(request: NextRequest) {
  let callerId: string;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return bad("Bạn chưa đăng nhập.", 401);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_active || !isStaffRole(profile.role)) {
      return bad("Bạn không có quyền thực hiện thao tác này.", 403);
    }
    callerId = user.id;
  } catch (err) {
    console.error("[api/members/resend-invite] Lỗi xác thực:", err);
    return bad("Không xác thực được phiên đăng nhập.", 500);
  }

  let memberId: string | undefined;
  try {
    ({ memberId } = await request.json());
  } catch {
    return bad("Dữ liệu gửi lên không hợp lệ.");
  }
  if (!memberId) return bad("Thiếu mã thành viên.");

  const admin = createAdminClient();

  const { data: member, error: findError } = await admin
    .from("profiles")
    .select("id, email, full_name, must_change_password")
    .eq("id", memberId)
    .single();

  if (findError || !member) return bad("Không tìm thấy thành viên.", 404);
  if (!member.email) return bad("Thành viên này chưa có email.", 400);
  if (!member.must_change_password) {
    return bad("Thành viên này đã đổi mật khẩu, không cần gửi lại lời mời.", 409);
  }

  const tempPassword = generateTempPassword();

  const { error: updateError } = await admin.auth.admin.updateUserById(memberId, {
    password: tempPassword,
  });

  if (updateError) {
    console.error("[api/members/resend-invite] Đặt lại mật khẩu thất bại:", updateError);
    return bad("Không đặt lại được mật khẩu tạm. Vui lòng thử lại.", 500);
  }

  const result = await sendWelcomeEmail({
    to: member.email,
    fullName: member.full_name ?? "",
    tempPassword,
    origin: new URL(request.url).origin,
  });

  console.log("[api/members/resend-invite] Đã gửi lại lời mời:", {
    by: callerId,
    memberId,
    emailSent: result.sent,
  });

  return NextResponse.json({
    email: member.email,
    temp_password: tempPassword,
    email_sent: result.sent,
    email_error: result.error ?? null,
  });
}
