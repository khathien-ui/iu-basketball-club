"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SessionFormDialog from "./SessionFormDialog";
import {
  formatRange,
  formatSessionDate,
  sessionState,
  STATE_LABEL,
  type TrainingSession,
} from "@/lib/sessions";

interface Props {
  initialSessions: TrainingSession[];
  checkinCounts: Record<string, number>;
  activeMembers: number;
}

export default function SessionsList({ initialSessions, checkinCounts, activeMembers }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [creating, setCreating] = useState<"single" | "weekly" | null>(null);
  const [alert, setAlert] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total: sessions.length,
      open: sessions.filter((s) => sessionState(s, now) === "open").length,
      upcoming: sessions.filter((s) => sessionState(s, now) === "upcoming").length,
    };
  }, [sessions]);

  async function reload() {
    const supabase = createClient();
    const { data } = await supabase
      .from("training_sessions")
      .select(
        "id, title, session_date, start_time, end_time, location, checkin_code, checkin_opens_at, checkin_closes_at, is_active, created_by, created_at, note"
      )
      .order("session_date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(100);
    if (data) setSessions(data as TrainingSession[]);
    router.refresh();
  }

  return (
    <div className="recruits">
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.total}</span>
          <span className="stat-card__label">Tổng buổi tập</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.open}</span>
          <span className="stat-card__label">Đang mở check-in</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{activeMembers}</span>
          <span className="stat-card__label">Thành viên hoạt động</span>
        </div>
      </div>

      <div className="toolbar">
        <button type="button" className="btn btn--solid" onClick={() => setCreating("single")}>
          Tạo buổi tập
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setCreating("weekly")}>
          Tạo lịch hàng tuần
        </button>
      </div>

      {alert && (
        <p className={alert.kind === "error" ? "form-alert" : "form-success"} role="alert">
          {alert.text}
        </p>
      )}

      {sessions.length === 0 ? (
        <div className="form-card recruits__empty">
          <p>Chưa có buổi tập nào. Bấm “Tạo buổi tập” để bắt đầu.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Buổi tập</th>
                <th>Ngày</th>
                <th>Giờ</th>
                <th>Địa điểm</th>
                <th>Check-in</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const state = sessionState(s);
                const count = checkinCounts[s.id] ?? 0;
                return (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/dashboard/sessions/${s.id}`)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") router.push(`/dashboard/sessions/${s.id}`);
                    }}
                  >
                    <td data-label="Buổi tập"><strong>{s.title}</strong></td>
                    <td data-label="Ngày">{formatSessionDate(s.session_date)}</td>
                    <td data-label="Giờ" className="mono nowrap">
                      {formatRange(s.start_time, s.end_time)}
                    </td>
                    <td data-label="Địa điểm">{s.location || "—"}</td>
                    <td data-label="Check-in" className="mono">
                      {count} / {activeMembers}
                    </td>
                    <td data-label="Trạng thái">
                      <span className={`state-badge state-badge--${state}`}>
                        {STATE_LABEL[state]}
                      </span>
                    </td>
                    <td data-label="" onClick={(e) => e.stopPropagation()}>
                      <a href={`/dashboard/sessions/${s.id}`} className="btn btn--ghost btn--sm">
                        Chi tiết
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <SessionFormDialog
          mode={creating}
          onClose={() => setCreating(null)}
          onCreated={(n) => {
            setCreating(null);
            setAlert({
              kind: "success",
              text: n === 1 ? "Đã tạo buổi tập." : `Đã tạo ${n} buổi tập.`,
            });
            reload();
          }}
          onError={(text) => setAlert({ kind: "error", text })}
        />
      )}
    </div>
  );
}
