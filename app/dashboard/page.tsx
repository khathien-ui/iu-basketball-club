import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { isMediaRole, isStaffRole, ROLE_LABEL, type UserRole } from "@/lib/members";

export const metadata: Metadata = {
  title: "Dashboard — IU Basketball Club",
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
  const role = profile?.role
    ? ROLE_LABEL[profile.role as UserRole] ?? profile.role
    : null;
  const isStaff = isStaffRole(profile?.role);
  // Ban truyền thông quản lý được sự kiện (RLS dùng is_media_manager).
  const canManageContent = isMediaRole(profile?.role);

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
              <p className="dash-actions">
                <a href="/checkin" className="btn btn--solid">Điểm danh buổi tập</a>
                <a href="/dashboard/profile" className="btn btn--ghost">Hồ sơ của tôi</a>
              </p>

              {canManageContent && (
                <p className="dash-actions">
                  <a href="/dashboard/events" className="btn btn--ghost">
                    Sự kiện
                  </a>
                  <a href="/dashboard/posts" className="btn btn--ghost">
                    Bài viết
                  </a>
                  <a href="/dashboard/albums" className="btn btn--ghost">
                    Album ảnh
                  </a>
                </p>
              )}

              {isStaff && (
                <p className="dash-actions">
                  <a href="/dashboard/members" className="btn btn--ghost">
                    Quản lý thành viên
                  </a>
                  <a href="/dashboard/sessions" className="btn btn--ghost">
                    Buổi tập &amp; điểm danh
                  </a>
                  <a href="/dashboard/attendance" className="btn btn--ghost">
                    Báo cáo chuyên cần
                  </a>
                  <a href="/dashboard/recruits" className="btn btn--ghost">
                    Xem đơn tuyển quân
                  </a>
                  <a href="/dashboard/settings" className="btn btn--ghost">
                    Cài đặt đợt đăng ký
                  </a>
                </p>
              )}
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
