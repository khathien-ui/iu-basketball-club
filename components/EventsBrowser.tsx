"use client";

import { useMemo, useState } from "react";
import {
  EVENT_TYPE_LABEL,
  EVENT_TYPE_ORDER,
  formatEventDate,
  formatEventTime,
  type ClubEventRow,
  type EventType,
} from "@/lib/events";

interface Props {
  events: ClubEventRow[];
}

const TAG_LABEL: Record<string, string> = {
  tryout: "TRYOUTS",
  match: "MATCH",
  tournament: "TOURNAMENT",
  team_building: "TEAM BUILDING",
  other: "EVENT",
};

function todayYmd(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function EventsBrowser({ events }: Props) {
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");

  const { upcoming, past } = useMemo(() => {
    const today = todayYmd();
    const filtered = events.filter((e) => typeFilter === "all" || e.event_type === typeFilter);

    const up = filtered
      .filter((e) => !e.event_date || e.event_date >= today)
      .sort((a, b) => {
        // Sự kiện chưa chốt ngày (TBA) xếp cuối nhóm sắp tới.
        if (!a.event_date && !b.event_date) return a.title.localeCompare(b.title, "vi");
        if (!a.event_date) return 1;
        if (!b.event_date) return -1;
        return a.event_date.localeCompare(b.event_date);
      });

    const old = filtered
      .filter((e) => e.event_date && e.event_date < today)
      .sort((a, b) => (b.event_date ?? "").localeCompare(a.event_date ?? ""));

    return { upcoming: up, past: old };
  }, [events, typeFilter]);

  return (
    <div className="events-browser">
      <div className="filter-chips" role="group" aria-label="Lọc theo loại sự kiện">
        <button
          type="button"
          className={`chip${typeFilter === "all" ? " is-active" : ""}`}
          onClick={() => setTypeFilter("all")}
        >
          Tất cả
        </button>
        {EVENT_TYPE_ORDER.map((t) => (
          <button
            key={t}
            type="button"
            className={`chip${typeFilter === t ? " is-active" : ""}`}
            onClick={() => setTypeFilter(t)}
          >
            {EVENT_TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <h2 className="browser-heading">Sắp tới</h2>
      {upcoming.length === 0 ? (
        <p className="field__hint browser-empty">
          Không có sự kiện sắp tới{typeFilter !== "all" ? " thuộc loại này" : ""}.
        </p>
      ) : (
        <div className="events-list">
          {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      )}

      <h2 className="browser-heading">Đã diễn ra</h2>
      {past.length === 0 ? (
        <p className="field__hint browser-empty">
          Chưa có sự kiện nào đã diễn ra{typeFilter !== "all" ? " thuộc loại này" : ""}.
        </p>
      ) : (
        <div className="events-list events-list--past">
          {past.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: ClubEventRow }) {
  return (
    <a href={`/events/${event.slug}`} className="event-row event-row--link">
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
        <span className="btn btn--ghost">Chi tiết</span>
      </div>
    </a>
  );
}
