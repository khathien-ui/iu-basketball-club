import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostsAdmin from "@/components/PostsAdmin";
import { isMediaRole } from "@/lib/members";
import { POST_COLUMNS, type PostRow } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Bài viết — IU Basketball Club",
};

export const dynamic = "force-dynamic";

export default async function PostsAdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/posts");

  const { data: me } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!me || !me.is_active || !isMediaRole(me.role)) redirect("/dashboard");

  const { data: postRows, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const posts = (postRows ?? []) as PostRow[];

  // Tên tác giả cho cột "Tác giả".
  const authorNames: Record<string, string> = {};
  const authorIds = Array.from(
    new Set(posts.map((p) => p.author_id).filter((id): id is string => !!id))
  );
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", authorIds);
    for (const a of authors ?? []) {
      authorNames[a.id] = a.full_name?.trim() || a.email || "(không rõ)";
    }
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <p className="eyebrow">Quản trị</p>
            <h1 className="section__title">Posts.</h1>
            <p className="section__lede">
              Viết và quản lý tin tức của CLB. Bài mới luôn ở dạng nháp và được
              tự lưu trong lúc soạn.
            </p>

            {error ? (
              <p className="form-alert" role="alert">
                Không tải được danh sách bài viết: {error.message}
              </p>
            ) : (
              <PostsAdmin
                initialPosts={posts}
                authorNames={authorNames}
                currentUserId={user.id}
              />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
