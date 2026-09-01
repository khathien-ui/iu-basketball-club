const ACCENT = "#ff5c1a";
const DARK = "#121214";

interface WelcomeEmailInput {
  fullName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
  logoUrl?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Email HTML dùng bảng + CSS inline — cách duy nhất hiển thị ổn định trên
 * Gmail, Outlook và các ứng dụng mail di động (chúng bỏ qua <style> và flex/grid).
 */
export function welcomeEmailHtml({
  fullName,
  email,
  tempPassword,
  loginUrl,
  logoUrl,
}: WelcomeEmailInput): string {
  const name = escapeHtml(fullName || "bạn");
  const safeEmail = escapeHtml(email);
  const safePass = escapeHtml(tempPassword);

  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" width="64" height="64" alt="IU Basketball Club"
         style="display:block;margin:0 auto 14px;border-radius:50%;background:#ffffff;" />`
    : "";

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Chào mừng đến với CLB Bóng rổ IU</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:${DARK};padding:28px 24px;">
              ${logoBlock}
              <div style="color:#ffffff;font-size:19px;font-weight:700;letter-spacing:-0.2px;">
                IU Basketball Club
              </div>
              <div style="color:${ACCENT};font-size:12px;letter-spacing:1px;text-transform:uppercase;margin-top:6px;">
                Trường Đại học Quốc tế · ĐHQG TP.HCM
              </div>
            </td>
          </tr>

          <!-- Nội dung -->
          <tr>
            <td style="padding:30px 26px 8px;">
              <h1 style="margin:0 0 14px;font-size:21px;line-height:1.35;color:#18181b;">
                Chào mừng ${name} đến với CLB Bóng rổ IU!
              </h1>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#3f3f46;">
                Tài khoản thành viên của bạn đã được ban điều hành tạo. Dùng thông tin bên dưới
                để đăng nhập vào khu vực thành viên của CLB.
              </p>
            </td>
          </tr>

          <!-- Thông tin đăng nhập -->
          <tr>
            <td style="padding:0 26px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#fafafa;border:1px solid #e4e4e7;border-radius:10px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.6px;">Email đăng nhập</div>
                    <div style="font-size:15px;color:#18181b;font-weight:600;margin-top:4px;word-break:break-all;">${safeEmail}</div>
                  </td>
                </tr>
                <tr><td style="padding:0 18px;"><div style="height:1px;background:#e4e4e7;"></div></td></tr>
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.6px;">Mật khẩu tạm</div>
                    <div style="font-size:19px;color:#18181b;font-weight:700;margin-top:6px;font-family:'SFMono-Regular',Consolas,'Courier New',monospace;letter-spacing:1.5px;">${safePass}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Nút đăng nhập -->
          <tr>
            <td align="center" style="padding:26px;">
              <a href="${escapeHtml(loginUrl)}"
                 style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;
                        font-size:15px;font-weight:600;padding:14px 34px;border-radius:9px;">
                Đăng nhập ngay
              </a>
            </td>
          </tr>

          <!-- Cảnh báo đổi mật khẩu -->
          <tr>
            <td style="padding:0 26px 26px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
                <tr>
                  <td style="padding:14px 18px;font-size:14px;line-height:1.6;color:#7c2d12;">
                    <strong>Bắt buộc đổi mật khẩu.</strong> Ở lần đăng nhập đầu tiên, hệ thống sẽ
                    yêu cầu bạn đặt mật khẩu mới trước khi vào được các trang khác.
                    Vui lòng không chia sẻ mật khẩu tạm này cho ai.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#fafafa;border-top:1px solid #e4e4e7;padding:20px 26px;">
              <div style="font-size:12px;line-height:1.7;color:#71717a;">
                Nếu bạn không mong đợi email này, vui lòng bỏ qua hoặc báo cho ban điều hành CLB.<br />
                © 2026 CLB Bóng rổ IU — IU Basketball Club
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Bản chữ thuần cho ứng dụng mail không đọc HTML. */
export function welcomeEmailText({
  fullName,
  email,
  tempPassword,
  loginUrl,
}: WelcomeEmailInput): string {
  return [
    `Chào mừng ${fullName || "bạn"} đến với CLB Bóng rổ IU!`,
    "",
    "Tài khoản thành viên của bạn đã được ban điều hành tạo.",
    "",
    `Email đăng nhập: ${email}`,
    `Mật khẩu tạm: ${tempPassword}`,
    "",
    `Đăng nhập tại: ${loginUrl}`,
    "",
    "BẮT BUỘC: Ở lần đăng nhập đầu tiên, hệ thống sẽ yêu cầu bạn đổi mật khẩu.",
    "Vui lòng không chia sẻ mật khẩu tạm này cho ai.",
    "",
    "© 2026 CLB Bóng rổ IU — IU Basketball Club",
  ].join("\n");
}
