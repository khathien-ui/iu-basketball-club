import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Quên mật khẩu — IU Basketball Club",
  description: "Yêu cầu đặt lại mật khẩu tài khoản thành viên CLB Bóng rổ IU.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Khu vực thành viên"
      title="Forgot Password."
      lede="Nhập email tài khoản, chúng tôi sẽ gửi liên kết đặt lại mật khẩu cho bạn."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
