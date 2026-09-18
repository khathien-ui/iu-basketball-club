import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostContent from "@/components/PostContent";
import { formatPostDate, POST_CATEGORY_LABEL } from "@/lib/posts";
import { getAuthorName, getPostBySlug } from "@/lib/publicData";

export const dynamic = "force-dynamic";

/** Cắt nội dung markdown thành mô tả ngắn khi bài không có excerpt. */
function fallbackDescription(content: string | null): string {
  if (!content) return "Tin tức từ CLB Bóng rổ IU.";
  const plain = content
    .replace(/!\[[^\]]*\]\([^)]*\)(\{[^}]*\})?/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*>`_~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 160 ? `${plain.slice(0, 157)}…` : plain;
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Không tìm thấy bài viết — IU Basketball Club" };

  const description = post.excerpt?.trim() || fallbackDescription(post.content);
  const authorName = await getAuthorName(post.author_id);

  return {
    title: `${post.title} — IU Basketball Club`,
    description,
    authors: authorName ? [{ name: authorName }] : undefined,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      authors: authorName ? [authorName] : undefined,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
    },
    twitter: {
      card: post.cover_image_url ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

export default async function PostDetailPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const authorName = await getAuthorName(post.author_id);

  return (
    <>
      <Navbar />
      <main className="page">
        <article className="section section--first">
          <div className="section-inner section-inner--narrow">
            <a href="/news" className="back-link">← Tất cả tin tức</a>

            <p className="eyebrow">{POST_CATEGORY_LABEL[post.category]}</p>
            <h1 className="section__title">{post.title}</h1>

            <p className="post-byline">
              {authorName && <span className="post-byline__author">{authorName}</span>}
              {authorName && post.published_at && <span aria-hidden="true"> · </span>}
              {post.published_at && (
                <time dateTime={post.published_at} className="mono">
                  {formatPostDate(post.published_at)}
                </time>
              )}
            </p>

            {post.cover_image_url && (
              <figure className="detail-cover">
                <img src={post.cover_image_url} alt="" />
              </figure>
            )}

            {post.excerpt && <p className="detail-lede">{post.excerpt}</p>}

            {post.content ? (
              <div className="detail-content">
                <PostContent content={post.content} />
              </div>
            ) : (
              <p className="field__hint">Bài viết chưa có nội dung.</p>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
