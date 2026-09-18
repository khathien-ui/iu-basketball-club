import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PhotoMasonry from "@/components/PhotoMasonry";
import EmptyState from "@/components/EmptyState";
import { formatAlbumDate } from "@/lib/albums";
import { getAlbumBySlug, getAlbumPhotos, getEventBySlug } from "@/lib/publicData";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getLinkedEvent(eventId: string | null) {
  if (!eventId) return null;
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("events")
      .select("slug, title")
      .eq("id", eventId)
      .eq("is_published", true)
      .maybeSingle();
    return (data as { slug: string; title: string }) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const album = await getAlbumBySlug(params.slug);
  if (!album) return { title: "Không tìm thấy album — IU Basketball Club" };

  const description =
    album.description?.trim() ||
    `Album ảnh ${album.title} của CLB Bóng rổ IU${album.album_date ? ` — ${formatAlbumDate(album.album_date)}` : ""}.`;

  return {
    title: `${album.title} — IU Basketball Club`,
    description,
    openGraph: {
      title: album.title,
      description,
      type: "article",
      images: album.cover_image_url ? [{ url: album.cover_image_url }] : undefined,
    },
    twitter: {
      card: album.cover_image_url ? "summary_large_image" : "summary",
      title: album.title,
      description,
      images: album.cover_image_url ? [album.cover_image_url] : undefined,
    },
  };
}

export default async function AlbumPage({ params }: { params: { slug: string } }) {
  const album = await getAlbumBySlug(params.slug);
  if (!album) notFound();

  const [photos, linkedEvent] = await Promise.all([
    getAlbumPhotos(album.id),
    getLinkedEvent(album.event_id),
  ]);

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <a href="/gallery" className="back-link">← Tất cả album</a>

            <p className="eyebrow">Album ảnh</p>
            <h1 className="section__title">{album.title}</h1>
            <p className="section__lede">
              {formatAlbumDate(album.album_date)} · {photos.length} ảnh
              {linkedEvent && (
                <>
                  {" · "}
                  <a href={`/events/${linkedEvent.slug}`} className="link-arrow">
                    {linkedEvent.title}
                  </a>
                </>
              )}
            </p>

            {album.description && <p className="detail-lede">{album.description}</p>}

            {photos.length === 0 ? (
              <EmptyState
                title="Album chưa có ảnh"
                message="Ảnh sẽ được cập nhật sớm."
                showFanpage={false}
              />
            ) : (
              <PhotoMasonry photos={photos} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
