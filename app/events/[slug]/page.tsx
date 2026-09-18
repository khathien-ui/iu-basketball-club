import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostContent from "@/components/PostContent";
import JoinEventButton from "@/components/JoinEventButton";
import PhotoMasonry from "@/components/PhotoMasonry";
import {
  canJoinEvent,
  EVENT_TYPE_LABEL,
  formatEventDate,
  formatEventTime,
} from "@/lib/events";
import {
  getAlbumForEvent,
  getAlbumPhotos,
  getCurrentUserId,
  getEventBySlug,
  getGoingCount,
  getMyParticipation,
} from "@/lib/publicData";
import { getRegistrationWindow } from "@/lib/getRegistrationWindow";
import { isWindowOpen } from "@/lib/registrationWindows";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const event = await getEventBySlug(params.slug);
  if (!event) return { title: "Không tìm thấy sự kiện — IU Basketball Club" };

  const when = formatEventDate(event.event_date);
  const description =
    event.description?.trim() ||
    `${EVENT_TYPE_LABEL[event.event_type]} của CLB Bóng rổ IU — ${when}${event.location ? ` tại ${event.location}` : ""}.`;

  return {
    title: `${event.title} — IU Basketball Club`,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "article",
      images: event.cover_image_url ? [{ url: event.cover_image_url }] : undefined,
    },
    twitter: {
      card: event.cover_image_url ? "summary_large_image" : "summary",
      title: event.title,
      description,
      images: event.cover_image_url ? [event.cover_image_url] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();

  const [userId, goingCount, album, signupWindow] = await Promise.all([
    getCurrentUserId(),
    getGoingCount(event.id),
    getAlbumForEvent(event.id),
    event.event_type === "tryout" || event.event_type === "tournament"
      ? getRegistrationWindow(event.event_type === "tryout" ? "tryout" : "tournament")
      : Promise.resolve(null),
  ]);

  const myStatus = userId ? await getMyParticipation(event.id, userId) : null;
  const photos = album ? await getAlbumPhotos(album.id, 12) : [];
  const signupOpen = isWindowOpen(signupWindow);

  return (
    <>
      <Navbar />
      <main className="page">
        <article className="section section--first">
          <div className="section-inner section-inner--narrow">
            <a href="/events" className="back-link">← Tất cả sự kiện</a>

            <p className="eyebrow">{EVENT_TYPE_LABEL[event.event_type]}</p>
            <h1 className="section__title">{event.title}</h1>

            <dl className="detail-meta">
              <div>
                <dt>Thời gian</dt>
                <dd>
                  {formatEventDate(event.event_date)}
                  {event.start_time && ` · ${formatEventTime(event.start_time, event.end_time)}`}
                </dd>
              </div>
              {event.location && (
                <div><dt>Địa điểm</dt><dd>{event.location}</dd></div>
              )}
              {canJoinEvent(event) && (
                <div>
                  <dt>Đã tham gia</dt>
                  <dd className="mono">
                    {goingCount}
                    {event.max_participants ? ` / ${event.max_participants}` : ""}
                  </dd>
                </div>
              )}
            </dl>

            {event.cover_image_url && (
              <figure className="detail-cover">
                <img src={event.cover_image_url} alt="" />
              </figure>
            )}

            {event.description && <p className="detail-lede">{event.description}</p>}

            <div className="detail-actions">
              {event.event_type === "tryout" ? (
                signupOpen ? (
                  <a href="/tryout" className="btn btn--solid btn--lg">Đăng ký tuyển quân</a>
                ) : (
                  <>
                    <span className="btn btn--ghost btn--lg is-locked" aria-disabled="true">Sắp mở</span>
                    <span className="field__hint">Đợt tuyển quân hiện chưa mở.</span>
                  </>
                )
              ) : event.event_type === "tournament" ? (
                signupOpen ? (
                  <a href="/tournament-signup" className="btn btn--solid btn--lg">Đăng ký đội</a>
                ) : (
                  <>
                    <span className="btn btn--ghost btn--lg is-locked" aria-disabled="true">Sắp mở</span>
                    <span className="field__hint">Đăng ký đội cho giải này hiện chưa mở.</span>
                  </>
                )
              ) : canJoinEvent(event) ? (
                <JoinEventButton
                  eventId={event.id}
                  slug={event.slug}
                  isLoggedIn={!!userId}
                  initialStatus={myStatus}
                  goingCount={goingCount}
                  maxParticipants={event.max_participants}
                />
              ) : null}
            </div>

            {event.content && (
              <div className="detail-content">
                <PostContent content={event.content} />
              </div>
            )}

            {album && photos.length > 0 && (
              <section className="detail-album">
                <h2 className="session-detail__subtitle">Album ảnh: {album.title}</h2>
                <PhotoMasonry photos={photos} />
                <p className="section-more">
                  <a href={`/gallery/${album.slug}`} className="link-arrow">
                    Xem toàn bộ album <span aria-hidden="true">→</span>
                  </a>
                </p>
              </section>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
