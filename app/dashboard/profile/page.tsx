import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileForm from "@/components/ProfileForm";
import type { Profile } from "@/lib/members";

export const metadata: Metadata = {
  title: "Hồ sơ của tôi — IU Basketball Club",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/profile");

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, student_id, email, phone, role, position, height_cm, joined_year, avatar_url, is_active, must_change_password, created_at"
    )
    .eq("id", user.id)
    .single();

  const profile = data as Profile | null;

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner section-inner--narrow">
            <p className="eyebrow">Khu vực thành viên</p>
            <h1 className="section__title">My Profile.</h1>
            <p className="section__lede">
              Xem thông tin thành viên của bạn, cập nhật số điện thoại, ảnh đại diện
              và đổi mật khẩu.
            </p>

            {error || !profile ? (
              <p className="form-alert" role="alert">
                Không tải được hồ sơ của bạn
                {error ? `: ${error.message}` : "."}
              </p>
            ) : (
              <ProfileForm profile={profile} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
