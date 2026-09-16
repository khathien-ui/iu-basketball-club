"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import EventFormDialog from "./EventFormDialog";
import {
  EVENT_TYPE_LABEL,
  EVENT_TYPE_ORDER,
  formatEventDate,
  formatEventTime,
  type ClubEventRow,
  type EventType,
} from "@/lib/events";

type PublishFilter = "all" | "published" | "draft";

interface Props {
  initialEvents: ClubEventRow[];
  goingCounts: Record<string, number>;
}

export default function EventsAdmin({ initialEvents, goingCounts }: Props) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ClubEventRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ClubEventRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const stats = useMemo(() => ({
    total: events.length,
    published: events.filter((e) => e.is_published).length,
    joinable: events.filter((e) => e.is_published && e.allow_join).length,
  }), [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((e) =>
        publishFilter === "all" ||
        (publishFilter === "published" ? e.is_published : !e.is_published)
      )
      .filter((e) => typeFilter === "all" || e.event_type === typeFilter)
      .filter((e) => !q || e.title.toLowerCase().includes(q) || e.slug.includes(q));
  }, [events, publishFilter, typeFilter, query]);

  async function togglePublish(event: ClubEventRow) {
    setAlert(null);
    setBusyId(event.id);
    const next = !event.is_published;
    const previous = events;
    setEvents((es) => es.map((e) => (e.id === event.id ? { ...e, is_published: next } : e)));

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("events")
        .update({ is_published: next })
        .eq("id", event.id);

      if (error) {
        setEvents(previous);
        setAlert({
          kind: "error",
          text: error.code === "42501"
            ? "Bạn không có quyền thay đổi sự kiện này."
            : "Không cập nhật được trạng thái. Vui lòng thử lại.",
        });
        return;
      }
      setAlert({ kind: "success", text: next ? "Đã đăng sự kiện." : "Đã chuyển về nháp." });
      router.refresh();
    } catch {
      setEvents(previous);
      setAlert({ kind: "error", text: "Không kết nối được máy chủ." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(event: ClubEventRow) {
    setAlert(null);
    setBusyId(event.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("events").delete().eq("id", event.id);
      if (error) {
        setAlert({
          kind: "error",
          text: error.code === "42501"
            ? "Bạn không có quyền xoá sự kiện này."
            : "Không xoá được sự kiện. Vui lòng thử lại.",
        });
        return;
      }
      setEvents((es) => es.filter((e) => e.id !== event.id));
      setAlert({ kind: "success", text: `Đã xoá sự kiện “${event.title}”.` });
      router.refresh();
    } catch {
      setAlert({ kind: "error", text: "Không kết nối được máy chủ." });
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  }

  function handleSaved(saved: ClubEventRow, isNew: boolean, finalSlug: string) {
    setEvents((es) => (isNew ? [saved, ...es] : es.map((e) => (e.id === saved.id ? saved : e))));
    setCreating(false);
    setEditing(null);
    setAlert({
      kind: "success",
      text: `${isNew ? "Đã tạo sự kiện (bản nháp)" : "Đã lưu thay đổi"} · đường dẫn /events/${finalSlug}`,
    });
    router.refresh();
  }

  return (
    <div className="recruits">
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.total}</span>
          <span className="stat-card__label">Tổng sự kiện</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.published}</span>
          <span className="stat-card__label">Đã đăng</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.joinable}</span>
          <span className="stat-card__label">Đang nhận tham gia</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar__search field">
          <label htmlFor="evSearch" className="sr-only">Tìm theo tiêu đề hoặc slug</label>
          <input id="evSearch" type="search" value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc slug…" />
        </div>

        <div className="field">
          <label htmlFor="evPublish" className="sr-only">Lọc theo trạng thái</label>
          <select id="evPublish" value={publishFilter}
            onChange={(e) => setPublishFilter(e.target.value as PublishFilter)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã đăng</option>
            <option value="draft">Nháp</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="evType" className="sr-only">Lọc theo loại</label>
          <select id="evType" value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as EventType | "all")}>
            <option value="all">Tất cả loại</option>
            {EVENT_TYPE_ORDER.map((t) => (
              <option key={t} value={t}>{EVENT_TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>

        <button type="button" className="btn btn--solid" onClick={() => setCreating(true)}>
          Tạo sự kiện
        </button>
      </div>

      {alert && (
        <p className={alert.kind === "error" ? "form-alert" : "form-success"} role="alert">
          {alert.text}
        </p>
      )}

      <p className="recruits__count">Hiển thị {filtered.length} / {events.length} sự kiện</p>

      {filtered.length === 0 ? (
        <div className="form-card recruits__empty">
          <p>{events.length === 0 ? "Chưa có sự kiện nào. Bấm “Tạo sự kiện” để bắt đầu." : "Không có sự kiện khớp bộ lọc."}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sự kiện</th>
                <th>Loại</th>
                <th>Ngày</th>
                <th>Địa điểm</th>
                <th>Tham gia</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const going = goingCounts[e.id] ?? 0;
                return (
                  <tr key={e.id} className={busyId === e.id ? "is-saving" : undefined}>
                    <td data-label="Sự kiện">
                      <span className="event-cell">
                        {e.cover_image_url ? (
                          <img className="event-cell__thumb" src={e.cover_image_url} alt="" />
                        ) : (
                          <span className="event-cell__thumb event-cell__thumb--empty" aria-hidden="true" />
                        )}
                        <span className="member-cell__text">
                          <strong>{e.title}</strong>
                          <em className="mono">/{e.slug}</em>
                        </span>
                      </span>
                    </td>
                    <td data-label="Loại">
                      <span className="pos-chip">{EVENT_TYPE_LABEL[e.event_type]}</span>
                    </td>
                    <td data-label="Ngày" className="nowrap">
                      {formatEventDate(e.event_date)}
                      {e.start_time && (
                        <span className="event-time mono"> {formatEventTime(e.start_time, e.end_time)}</span>
                      )}
                    </td>
                    <td data-label="Địa điểm">{e.location || "—"}</td>
                    <td data-label="Tham gia" className="mono">
                      {e.allow_join
                        ? `${going}${e.max_participants ? ` / ${e.max_participants}` : ""}`
                        : "—"}
                    </td>
                    <td data-label="Trạng thái">
                      <span className={`state-badge state-badge--${e.is_published ? "open" : "closed"}`}>
                        {e.is_published ? "Đã đăng" : "Nháp"}
                      </span>
                    </td>
                    <td data-label="">
                      <div className="mark-actions">
                        <button type="button" className="btn btn--ghost btn--sm"
                          disabled={busyId === e.id} onClick={() => togglePublish(e)}>
                          {e.is_published ? "Ẩn" : "Đăng"}
                        </button>
                        <a href={`/dashboard/events/${e.id}`} className="btn btn--ghost btn--sm">
                          Chi tiết
                        </a>
                        <button type="button" className="btn btn--ghost btn--sm"
                          disabled={busyId === e.id} onClick={() => setEditing(e)}>
                          Sửa
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm"
                          disabled={busyId === e.id} onClick={() => setConfirmDelete(e)}>
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <EventFormDialog
          event={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Xoá sự kiện?"
          message={`Sự kiện “${confirmDelete.title}” sẽ bị xoá vĩnh viễn, kèm theo toàn bộ danh sách người đã đăng ký tham gia. Không thể hoàn tác.`}
          confirmLabel="Xoá sự kiện"
          busy={busyId === confirmDelete.id}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
  title, message, confirmLabel, busy, onCancel, onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="lightbox confirm" role="dialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="form-card confirm__panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="confirm__title">{title}</h2>
        <p className="confirm__message">{message}</p>
        <div className="confirm__actions">
          <button type="button" className="btn btn--ghost btn--lg" onClick={onCancel} disabled={busy}>
            Huỷ
          </button>
          <button type="button" className="btn btn--danger btn--lg" onClick={onConfirm} disabled={busy}>
            {busy ? "Đang xoá…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
