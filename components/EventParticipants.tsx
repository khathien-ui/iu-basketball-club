"use client";

import { useMemo, useState } from "react";
import { initialsOf, ROLE_LABEL, type Profile } from "@/lib/members";
import {
  canJoinEvent,
  EVENT_TYPE_LABEL,
  formatEventDate,
  formatEventTime,
  formatJoinedAt,
  isEventFull,
  PARTICIPANT_LABEL,
  PARTICIPANT_ORDER,
  type ClubEventRow,
  type EventParticipant,
  type ParticipantStatus,
} from "@/lib/events";
import { exportParticipantsToExcel, type ParticipantRow } from "@/lib/exportParticipants";

interface Props {
  event: ClubEventRow;
  participants: EventParticipant[];
  members: Profile[];
}

export default function EventParticipants({ event, participants, members }: Props) {
  const [statusFilter, setStatusFilter] = useState<ParticipantStatus | "all">("all");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberById = useMemo(() => {
    const map = new Map<string, Profile>();
    for (const m of members) map.set(m.id, m);
    return map;
  }, [members]);

  const rows: ParticipantRow[] = useMemo(
    () => participants.map((p) => ({ participant: p, member: memberById.get(p.member_id) ?? null })),
    [participants, memberById]
  );

  const counts = useMemo(() => ({
    going: participants.filter((p) => p.status === "going").length,
    maybe: participants.filter((p) => p.status === "maybe").length,
    cancelled: participants.filter((p) => p.status === "cancelled").length,
  }), [participants]);

  const filtered = useMemo(
    () => rows.filter((r) => statusFilter === "all" || r.participant.status === statusFilter),
    [rows, statusFilter]
  );

  const joinable = canJoinEvent(event);
  const full = isEventFull(event, counts.going);

  async function handleExport() {
    setError(null);
    setExporting(true);
    try {
      await exportParticipantsToExcel(event, filtered);
    } catch (err) {
      console.error("[EventParticipants] Xuất Excel lỗi:", err);
      setError("Không tạo được file Excel. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="session-detail">
      <a href="/dashboard/events" className="back-link">← Danh sách sự kiện</a>

      <p className="eyebrow">{EVENT_TYPE_LABEL[event.event_type]}</p>
      <h1 className="section__title">{event.title}</h1>
      <p className="section__lede">
        {formatEventDate(event.event_date)}
        {event.start_time ? ` · ${formatEventTime(event.start_time, event.end_time)}` : ""}
        {event.location ? ` · ${event.location}` : ""}
      </p>

      <div className="event-flags">
        <span className={`state-badge state-badge--${event.is_published ? "open" : "closed"}`}>
          {event.is_published ? "Đã đăng" : "Nháp"}
        </span>
        <span className={`state-badge state-badge--${joinable ? "open" : "closed"}`}>
          {joinable ? "Đang nhận tham gia" : "Không nhận tham gia"}
        </span>
        {event.allow_join && event.max_participants && (
          <span className={`state-badge state-badge--${full ? "closed" : "upcoming"}`}>
            {full ? "Đã đủ người" : `Còn ${event.max_participants - counts.going} chỗ`}
          </span>
        )}
      </div>

      {!joinable && (
        <p className="field__hint">
          {event.is_published
            ? "Sự kiện đã đăng nhưng chưa bật cho thành viên tham gia — nút “Tham gia” ở trang công khai đang ẩn."
            : "Sự kiện còn ở dạng nháp nên chưa hiện ở trang công khai."}
        </p>
      )}

      <div className="stat-cards" style={{ marginTop: 24 }}>
        <div className="stat-card">
          <span className="stat-card__value mono">{counts.going}</span>
          <span className="stat-card__label">Tham gia</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{counts.maybe}</span>
          <span className="stat-card__label">Có thể tham gia</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{counts.cancelled}</span>
          <span className="stat-card__label">Đã huỷ</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="pStatus" className="sr-only">Lọc theo trạng thái</label>
          <select id="pStatus" value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ParticipantStatus | "all")}>
            <option value="all">Tất cả trạng thái</option>
            {PARTICIPANT_ORDER.map((s) => (
              <option key={s} value={s}>{PARTICIPANT_LABEL[s]}</option>
            ))}
          </select>
        </div>

        <button type="button" className="btn btn--ghost" onClick={handleExport}
          disabled={exporting || filtered.length === 0}>
          {exporting ? "Đang tạo file…" : "Xuất Excel"}
        </button>
      </div>

      {error && <p className="form-alert" role="alert">{error}</p>}

      <p className="recruits__count">
        Hiển thị {filtered.length} / {participants.length} người đăng ký
      </p>

      {filtered.length === 0 ? (
        <div className="form-card recruits__empty">
          <p>
            {participants.length === 0
              ? "Chưa có thành viên nào đăng ký tham gia sự kiện này."
              : "Không có ai khớp bộ lọc hiện tại."}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>MSSV</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Đăng ký lúc</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ participant, member }) => (
                <tr key={participant.id}>
                  <td data-label="Thành viên">
                    <span className="member-cell">
                      <span className="avatar">
                        {member?.avatar_url
                          ? <img src={member.avatar_url} alt="" />
                          : <span>{initialsOf(member?.full_name ?? null, member?.email ?? null)}</span>}
                      </span>
                      <span className="member-cell__text">
                        <strong>{member?.full_name || "(không rõ)"}</strong>
                        <em>{member?.email ?? ""}</em>
                      </span>
                    </span>
                  </td>
                  <td data-label="MSSV" className="mono">{member?.student_id || "—"}</td>
                  <td data-label="Vai trò">
                    {member ? (
                      <span className={`role-chip role-chip--${member.role}`}>
                        {ROLE_LABEL[member.role]}
                      </span>
                    ) : "—"}
                  </td>
                  <td data-label="Trạng thái">
                    <span className={`att-chip att-chip--${participant.status === "going" ? "present" : participant.status === "maybe" ? "late" : "absent"}`}>
                      {PARTICIPANT_LABEL[participant.status]}
                    </span>
                  </td>
                  <td data-label="Đăng ký lúc" className="mono nowrap">
                    {formatJoinedAt(participant.joined_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
