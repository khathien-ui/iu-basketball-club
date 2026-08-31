import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/LoginForm";
import AuthShell from "@/components/AuthShell";

export const metadata: Metadata = {
  title: "Đăng nhập — IU Basketball Club",
  description: "Đăng nhập khu vực thành viên CLB Bóng rổ IU.",
};

export default async function LoginPage() {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/dashboard");
  } catch {
    // Supabase chưa cấu hình — vẫn hiển thị form.
  }

  return (
    <AuthShell
      eyebrow="Khu vực thành viên"
      title="Member Login."
      lede="Đăng nhập bằng tài khoản do ban điều hành CLB cấp."
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
