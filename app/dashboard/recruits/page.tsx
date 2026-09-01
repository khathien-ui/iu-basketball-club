import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RecruitsTable from "@/components/RecruitsTable";
import type { Recruit } from "@/lib/recruits";

export const metadata: Metadata = {
  title: "Đơn tuyển quân — IU Basketball Club",
};

const STAFF_ROLES = ["admin", "executive_board"];

export default async function RecruitsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/recruits");

  // Chặn ở tầng trang: middleware chỉ giới hạn role cho /dashboard/admin/*.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    redirect("/dashboard");
  }

  const { data, error } = await supabase
    .from("recruits")
    .select(
      "id, full_name, student_id, email, phone, height_cm, position, experience, note, status, created_at"
    )
    .order("created_at", { ascending: false });

  const recruits = (data ?? []) as Recruit[];

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <p className="eyebrow">Quản trị</p>
            <h1 className="section__title">Tryout Applications.</h1>
            <p className="section__lede">
              Danh sách đơn đăng ký tuyển quân, mới nhất trước.
            </p>

            {error ? (
              <p className="form-alert" role="alert">
                Không tải được danh sách đơn: {error.message}
              </p>
            ) : (
              <RecruitsTable initialRecruits={recruits} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
