import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu — IU Basketball Club",
  description: "Đặt mật khẩu mới cho tài khoản thành viên CLB Bóng rổ IU.",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Khu vực thành viên"
      title="Reset Password."
      lede="Nhập mật khẩu mới cho tài khoản của bạn."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
