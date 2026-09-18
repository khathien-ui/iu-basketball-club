import EmptyState from "./EmptyState";
import PhotoMasonry from "./PhotoMasonry";
import { getGalleryPhotos } from "@/lib/publicData";

export const dynamic = "force-dynamic";

export default async function Gallery() {
  const photos = await getGalleryPhotos(6);

  return (
    <section className="section" id="gallery">
      <div className="section-inner">
        <p className="eyebrow">Ngày thi đấu</p>
        <h2 className="section__title">Gallery.</h2>
        <p className="section__lede">
          Hình ảnh và khoảnh khắc nổi bật từ các buổi tuyển quân, tập luyện và giải đấu.
        </p>

        {photos.length === 0 ? (
          <EmptyState
            title="Chưa có ảnh nào"
            message="Ảnh từ các buổi tập, giải đấu và sự kiện của CLB sẽ xuất hiện ở đây."
          />
        ) : (
          <>
            <PhotoMasonry photos={photos} />
            <p className="section-more">
              <a href="/gallery" className="link-arrow">
                Xem tất cả album <span aria-hidden="true">→</span>
              </a>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
