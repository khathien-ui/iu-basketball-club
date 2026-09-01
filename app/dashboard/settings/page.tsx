import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SettingsForm from "@/components/SettingsForm";
import { getAllRegistrationWindows } from "@/lib/getRegistrationWindow";

export const metadata: Metadata = {
  title: "Cài đặt đợt đăng ký — IU Basketball Club",
};

export const dynamic = "force-dynamic";

const STAFF_ROLES = ["admin", "executive_board"];

export default async function SettingsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    redirect("/dashboard");
  }

  const windows = await getAllRegistrationWindows();

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner section-inner--narrow">
            <p className="eyebrow">Quản trị</p>
            <h1 className="section__title">Registration Settings.</h1>
            <p className="section__lede">
              Đóng/mở từng đợt đăng ký, đặt lịch và nội dung thông báo khi đóng.
            </p>

            <SettingsForm initialWindows={windows} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
