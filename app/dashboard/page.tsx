import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Dashboard — IU Basketball Club",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Quản trị viên",
  executive_board: "Ban điều hành",
  member: "Thành viên",
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware đã chặn, đây là lớp bảo vệ thứ hai.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name?.trim() || user.email || "bạn";
  const role = profile?.role ? ROLE_LABEL[profile.role] ?? profile.role : null;

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner section-inner--narrow">
            <p className="eyebrow">Khu vực thành viên</p>
            <h1 className="section__title">Xin chào {name}.</h1>
            {role && <p className="section__lede">Bạn đang đăng nhập với vai trò {role}.</p>}

            <div className="form-card">
              <p className="form-note" style={{ marginTop: 0 }}>
                Khu vực thành viên đang được xây dựng. Các tính năng hồ sơ cá nhân,
                danh sách đội hình và quản lý sự kiện sẽ sớm có mặt tại đây.
              </p>
              <form action={signOut}>
                <button type="submit" className="btn btn--ghost btn--lg form-submit">
                  Đăng xuất
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
