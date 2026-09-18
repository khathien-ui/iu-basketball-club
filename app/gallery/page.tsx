import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import { formatAlbumDate } from "@/lib/albums";
import { getPhotoCounts, getPublishedAlbums } from "@/lib/publicData";

export const metadata: Metadata = {
  title: "Thư viện ảnh — IU Basketball Club",
  description:
    "Album ảnh từ các buổi tập, giải đấu và sự kiện của CLB Bóng rổ IU — Trường Đại học Quốc tế, ĐHQG TP.HCM.",
  openGraph: {
    title: "Thư viện ảnh — IU Basketball Club",
    description: "Album ảnh từ các buổi tập, giải đấu và sự kiện của CLB Bóng rổ IU.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const albums = await getPublishedAlbums();
  const counts = await getPhotoCounts(albums.map((a) => a.id));

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <p className="eyebrow">Ngày thi đấu</p>
            <h1 className="section__title">Gallery.</h1>
            <p className="section__lede">
              Album ảnh từ các buổi tuyển quân, tập luyện và giải đấu của CLB.
            </p>

            {albums.length === 0 ? (
              <EmptyState
                title="Chưa có album nào"
                message="Ảnh từ các hoạt động của CLB sẽ được đăng tại đây."
              />
            ) : (
              <div className="album-grid">
                {albums.map((a) => (
                  <a key={a.id} href={`/gallery/${a.slug}`} className="album-card">
                    <span className="album-card__media">
                      {a.cover_image_url ? (
                        <img src={a.cover_image_url} alt="" loading="lazy" />
                      ) : (
                        <span className="album-card__placeholder" aria-hidden="true" />
                      )}
                      <span className="album-card__count mono">{counts[a.id] ?? 0} ảnh</span>
                    </span>
                    <span className="album-card__body">
                      <strong>{a.title}</strong>
                      <span className="album-card__date mono">{formatAlbumDate(a.album_date)}</span>
                      {a.description && <span className="album-card__desc">{a.description}</span>}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
