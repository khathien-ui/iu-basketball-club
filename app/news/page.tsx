import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import NewsBrowser from "@/components/NewsBrowser";
import { getPublishedPosts } from "@/lib/publicData";

export const metadata: Metadata = {
  title: "Tin tức — IU Basketball Club",
  description:
    "Tường thuật trận đấu, thông báo và thành tích của CLB Bóng rổ IU — Trường Đại học Quốc tế, ĐHQG TP.HCM.",
  openGraph: {
    title: "Tin tức — IU Basketball Club",
    description: "Tường thuật trận đấu, thông báo và thành tích của CLB Bóng rổ IU.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <p className="eyebrow">Mới nhất</p>
            <h1 className="section__title">News.</h1>
            <p className="section__lede">
              Tường thuật trận đấu, thông báo và thành tích của CLB.
            </p>

            {posts.length === 0 ? (
              <EmptyState
                title="Chưa có tin tức nào"
                message="Các bài viết của CLB sẽ được đăng tại đây."
              />
            ) : (
              <NewsBrowser posts={posts} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
