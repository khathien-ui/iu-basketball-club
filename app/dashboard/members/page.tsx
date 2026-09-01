import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MembersTable from "@/components/MembersTable";
import { isStaffRole, type Profile } from "@/lib/members";

export const metadata: Metadata = {
  title: "Thành viên — IU Basketball Club",
};

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/members");

  // Lớp chặn thứ hai sau middleware (RLS là lớp thứ ba).
  const { data: me } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!me || !me.is_active || !isStaffRole(me.role)) {
    redirect("/dashboard");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, student_id, email, phone, role, position, height_cm, joined_year, avatar_url, is_active, must_change_password, created_at"
    )
    .order("role")
    .order("full_name");

  const members = (data ?? []) as Profile[];

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <p className="eyebrow">Quản trị</p>
            <h1 className="section__title">Members.</h1>
            <p className="section__lede">
              Danh sách thành viên CLB. Tài khoản do ban điều hành cấp, thành viên
              phải đổi mật khẩu ở lần đăng nhập đầu tiên.
            </p>

            {error ? (
              <p className="form-alert" role="alert">
                Không tải được danh sách thành viên: {error.message}
              </p>
            ) : (
              <MembersTable initialMembers={members} currentUserId={user.id} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
