import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTempPassword } from "@/lib/password";
import { sendWelcomeEmail } from "@/lib/email/sendWelcomeEmail";
import { isStaffRole, type UserRole } from "@/lib/members";

const VALID_ROLES: UserRole[] = ["admin", "executive_board", "member"];
const VALID_POSITIONS = ["PG", "SG", "SF", "PF", "C", "unknown"];

interface Body {
  email?: string;
  full_name?: string;
  student_id?: string;
  phone?: string;
  position?: string;
  height_cm?: number | string | null;
  joined_year?: number | string | null;
  role?: string;
  send_email?: boolean;
  recruit_id?: string | null;
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  // ---- 1. Người gọi phải là staff (API tự kiểm tra, không tin giao diện) ----
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
    console.error("[api/members] Lỗi xác thực người gọi:", err);
    return bad("Không xác thực được phiên đăng nhập.", 500);
  }

  // ---- 2. Validate dữ liệu ----
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return bad("Dữ liệu gửi lên không hợp lệ.");
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const fullName = body.full_name?.trim() ?? "";
  const studentId = body.student_id?.trim() || null;
  const phone = body.phone?.trim() || null;
  const position = body.position && VALID_POSITIONS.includes(body.position)
    ? body.position
    : "unknown";
  const role = (body.role && VALID_ROLES.includes(body.role as UserRole)
    ? body.role
    : "member") as UserRole;
  const sendEmail = body.send_email !== false;

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad("Email không đúng định dạng.");
  if (!fullName) return bad("Vui lòng nhập họ và tên.");

  const heightRaw = body.height_cm;
  const height = heightRaw === null || heightRaw === "" || heightRaw === undefined
    ? null
    : Number(heightRaw);
  if (height !== null && (!Number.isFinite(height) || height < 100 || height > 250)) {
    return bad("Chiều cao phải từ 100 đến 250 cm.");
  }

  const yearRaw = body.joined_year;
  const joinedYear = yearRaw === null || yearRaw === "" || yearRaw === undefined
    ? null
    : Number(yearRaw);
  if (joinedYear !== null && (!Number.isInteger(joinedYear) || joinedYear < 2000 || joinedYear > 2100)) {
    return bad("Năm vào CLB phải từ 2000 đến 2100.");
  }

  const admin = createAdminClient();

  // ---- 3. Chặn trùng trước khi tạo ----
  const { data: existing } = await admin
    .from("profiles")
    .select("id, email, student_id")
    .or(
      studentId
        ? `email.eq.${email},student_id.eq.${studentId}`
        : `email.eq.${email}`
    );

  if (existing && existing.length > 0) {
    const dupEmail = existing.some((p) => p.email?.toLowerCase() === email);
    return bad(
      dupEmail
        ? `Email ${email} đã tồn tại trong danh sách thành viên.`
        : `MSSV ${studentId} đã tồn tại trong danh sách thành viên.`,
      409
    );
  }

  // ---- 4. Tạo tài khoản với mật khẩu tạm ----
  const tempPassword = generateTempPassword();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true, // tài khoản do admin cấp, không cần bước xác nhận email
    user_metadata: { full_name: fullName },
  });

  if (createError || !created?.user) {
    console.error("[api/members] Tạo tài khoản thất bại:", createError);
    const message = createError?.message ?? "";
    if (message.toLowerCase().includes("already been registered")) {
      return bad(`Email ${email} đã có tài khoản đăng nhập.`, 409);
    }
    return bad("Không tạo được tài khoản. Vui lòng thử lại.", 500);
  }

  const newUserId = created.user.id;

  // ---- 5. Hoàn thiện hồ sơ (trigger 002 đã tạo dòng profiles) ----
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      student_id: studentId,
      email,
      phone,
      role,
      position,
      height_cm: height,
      joined_year: joinedYear,
      is_active: true,
      must_change_password: true,
    })
    .eq("id", newUserId);

  if (profileError) {
    console.error("[api/members] Cập nhật hồ sơ thất bại, dọn tài khoản vừa tạo:", profileError);
    await admin.auth.admin.deleteUser(newUserId);
    return bad("Không lưu được hồ sơ thành viên. Vui lòng thử lại.", 500);
  }

  // ---- 6. Đánh dấu đơn đã kết nạp (nếu kết nạp từ /dashboard/recruits) ----
  if (body.recruit_id) {
    const { error: recruitError } = await admin
      .from("recruits")
      .update({
        enrolled_at: new Date().toISOString(),
        enrolled_profile_id: newUserId,
        status: "passed",
      })
      .eq("id", body.recruit_id);

    if (recruitError) {
      // Tài khoản đã tạo xong — chỉ ghi log, không rollback.
      console.error("[api/members] Không đánh dấu được đơn đã kết nạp:", recruitError);
    }
  }

  // ---- 7. Gửi email (thất bại vẫn giữ tài khoản) ----
  let emailSent = false;
  let emailError: string | undefined;

  if (sendEmail) {
    const result = await sendWelcomeEmail({
      to: email,
      fullName,
      tempPassword,
      origin: new URL(request.url).origin,
    });
    emailSent = result.sent;
    emailError = result.error;
  }

  console.log("[api/members] Đã tạo thành viên:", {
    by: callerId,
    newUserId,
    email,
    role,
    emailSent,
  });

  return NextResponse.json({
    id: newUserId,
    email,
    temp_password: tempPassword,
    email_sent: emailSent,
    email_error: emailError ?? null,
  });
}
