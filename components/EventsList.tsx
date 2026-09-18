import EmptyState from "./EmptyState";
import JoinEventButton from "./JoinEventButton";
import {
  canJoinEvent,
  EVENT_TYPE_LABEL,
  formatEventDate,
  formatEventTime,
  type ClubEventRow,
} from "@/lib/events";
import { getCurrentUserId, getGoingCount, getMyParticipation, getUpcomingEvents } from "@/lib/publicData";
import { getRegistrationWindow } from "@/lib/getRegistrationWindow";
import { isWindowOpen } from "@/lib/registrationWindows";

export const dynamic = "force-dynamic";

/** Nhãn ngắn trên thẻ sự kiện, khớp enum event_type. */
const TAG_LABEL: Record<string, string> = {
  tryout: "TRYOUTS",
  match: "MATCH",
  tournament: "TOURNAMENT",
  team_building: "TEAM BUILDING",
  other: "EVENT",
};

export default async function EventsList() {
  const [events, userId, tryoutWindow] = await Promise.all([
    getUpcomingEvents(3),
    getCurrentUserId(),
    getRegistrationWindow("tryout"),
  ]);

  const tryoutOpen = isWindowOpen(tryoutWindow);

  // Chỉ những sự kiện mở nhận tham gia mới cần đếm người và tra trạng thái.
  const joinable = events.filter(canJoinEvent);
  const counts = new Map<string, number>();
  const mine = new Map<string, string | null>();
  await Promise.all(
    joinable.map(async (e) => {
      counts.set(e.id, await getGoingCount(e.id));
      if (userId) mine.set(e.id, await getMyParticipation(e.id, userId));
    })
  );

  return (
    <section className="section" id="events">
      <div className="section-inner">
        <p className="eyebrow">Bước lên sân</p>
        <h2 className="section__title">Upcoming Events.</h2>

        {events.length === 0 ? (
          <EmptyState
            title="Chưa có sự kiện nào sắp tới"
            message="CLB sẽ công bố lịch tuyển quân, giải đấu và các buổi sinh hoạt tại đây."
          />
        ) : (
          <>
            <div className="events-list">
              {events.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  tryoutOpen={tryoutOpen}
                  isLoggedIn={!!userId}
                  goingCount={counts.get(e.id) ?? 0}
                  myStatus={(mine.get(e.id) as never) ?? null}
                />
              ))}
            </div>

            <p className="section-more">
              <a href="/events" className="link-arrow">
                Xem tất cả sự kiện <span aria-hidden="true">→</span>
              </a>
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export function EventRow({
  event, tryoutOpen, isLoggedIn, goingCount, myStatus,
}: {
  event: ClubEventRow;
  tryoutOpen: boolean;
  isLoggedIn: boolean;
  goingCount: number;
  myStatus: "going" | "maybe" | "cancelled" | null;
}) {
  return (
    <article className="event-row">
      <div className="event-row__date">
        <span className="mono">{formatEventDate(event.event_date)}</span>
        {event.start_time && (
          <span className="mono event-time">{formatEventTime(event.start_time, event.end_time)}</span>
        )}
      </div>

      <div className="event-row__body">
        <h4>{event.title}</h4>
        {event.description && <p>{event.description}</p>}
        {event.location && <p className="event-row__loc">{event.location}</p>}
      </div>

      <span className="tag">{TAG_LABEL[event.event_type] ?? "EVENT"}</span>

      <div className="event-row__action">
        <EventAction
          event={event}
          tryoutOpen={tryoutOpen}
          isLoggedIn={isLoggedIn}
          goingCount={goingCount}
          myStatus={myStatus}
        />
      </div>
    </article>
  );
}

/**
 * Nút hành động theo loại sự kiện:
 *  - tryout            -> /tryout, khoá lại nếu đợt đang đóng
 *  - allow_join        -> nút Tham gia (yêu cầu đăng nhập)
 *  - còn lại           -> Chi tiết
 */
function EventAction({
  event, tryoutOpen, isLoggedIn, goingCount, myStatus,
}: {
  event: ClubEventRow;
  tryoutOpen: boolean;
  isLoggedIn: boolean;
  goingCount: number;
  myStatus: "going" | "maybe" | "cancelled" | null;
}) {
  if (event.event_type === "tryout") {
    return tryoutOpen ? (
      <a href="/tryout" className="btn btn--ghost">Register</a>
    ) : (
      <>
        <span className="btn btn--ghost is-locked" aria-disabled="true">Sắp mở</span>
        <span className="event-row__note">Đợt tuyển quân chưa mở</span>
      </>
    );
  }

  if (canJoinEvent(event)) {
    return (
      <JoinEventButton
        eventId={event.id}
        slug={event.slug}
        isLoggedIn={isLoggedIn}
        initialStatus={myStatus}
        goingCount={goingCount}
        maxParticipants={event.max_participants}
        compact
      />
    );
  }

  return (
    <a href={`/events/${event.slug}`} className="btn btn--ghost">Chi tiết</a>
  );
}

export { TAG_LABEL, EVENT_TYPE_LABEL };
