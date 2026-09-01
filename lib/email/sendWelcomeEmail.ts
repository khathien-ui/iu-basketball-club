import { Resend } from "resend";
import { welcomeEmailHtml, welcomeEmailText } from "./welcomeEmail";

export interface SendWelcomeResult {
  sent: boolean;
  error?: string;
}

interface Params {
  to: string;
  fullName: string;
  tempPassword: string;
  origin: string;
}

/**
 * Gửi email chào mừng. KHÔNG bao giờ throw — tài khoản đã được tạo trước đó,
 * lỗi gửi mail không được phép làm hỏng cả thao tác.
 */
export async function sendWelcomeEmail({
  to,
  fullName,
  tempPassword,
  origin,
}: Params): Promise<SendWelcomeResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    const error = "Thiếu RESEND_API_KEY hoặc EMAIL_FROM trong biến môi trường.";
    console.error("[sendWelcomeEmail]", error);
    return { sent: false, error };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
  const payload = {
    fullName,
    email: to,
    tempPassword,
    loginUrl: `${siteUrl}/login`,
    logoUrl: `${siteUrl}/assets/logo.png`,
  };

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: "Chào mừng bạn đến với CLB Bóng rổ IU",
      html: welcomeEmailHtml(payload),
      text: welcomeEmailText(payload),
    });

    if (error) {
      console.error("[sendWelcomeEmail] Resend trả lỗi:", {
        to,
        name: error.name,
        message: error.message,
      });
      return { sent: false, error: error.message };
    }

    console.log("[sendWelcomeEmail] Đã gửi:", { to, id: data?.id });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sendWelcomeEmail] Ngoại lệ khi gửi:", { to, message, err });
    return { sent: false, error: message };
  }
}
