import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthShell from "@/components/AuthShell";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export const metadata: Metadata = {
  title: "Đổi mật khẩu — IU Basketball Club",
};

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/change-password");

  return (
    <AuthShell
      eyebrow="Khu vực thành viên"
      title="Đổi mật khẩu."
      lede="Bạn đang dùng mật khẩu tạm do ban điều hành cấp. Hãy đặt mật khẩu mới để tiếp tục."
    >
      <ChangePasswordForm />
    </AuthShell>
  );
}
