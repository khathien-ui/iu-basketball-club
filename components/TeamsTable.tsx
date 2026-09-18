"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { POSITION_LABEL, POSITION_SHORT } from "@/lib/recruits";
import { exportTeamsToExcel } from "@/lib/exportTeams";
import {
  captainOf,
  formatTeamDate,
  TEAM_STATUS_LABEL,
  TEAM_STATUS_ORDER,
  type TeamStatus,
  type TeamWithMembers,
} from "@/lib/teams";

interface Props {
  initialTeams: TeamWithMembers[];
}

export default function TeamsTable({ initialTeams }: Props) {
  const [teams, setTeams] = useState<TeamWithMembers[]>(initialTeams);
  const [statusFilter, setStatusFilter] = useState<TeamStatus | "all">("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [detail, setDetail] = useState<TeamWithMembers | null>(null);

  useEffect(() => {
    if (!detail) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setDetail(null); };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [detail]);

  const stats = useMemo(() => ({
    total: teams.length,
    pending: teams.filter((t) => t.status === "pending").length,
    approved: teams.filter((t) => t.status === "approved").length,
    players: teams
      .filter((t) => t.status !== "rejected")
      .reduce((sum, t) => sum + t.members.length, 0),
  }), [teams]);

  /** Các giải có đội đăng ký — để lọc khi CLB tổ chức nhiều giải cùng lúc. */
  const events = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((t) => {
      if (t.tournament_event_id) {
        map.set(t.tournament_event_id, t.event_title ?? "Giải chưa đặt tên");
      }
    });
    return Array.from(map.entries());
  }, [teams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teams
      .filter((t) => statusFilter === "all" || t.status === statusFilter)
      .filter((t) => eventFilter === "all" || t.tournament_event_id === eventFilter)
      .filter((t) =>
        !q ||
        t.team_name.toLowerCase().includes(q) ||
        t.team_code.toLowerCase().includes(q) ||
        t.captain_name.toLowerCase().includes(q) ||
        t.captain_student_id.toLowerCase().includes(q) ||
        t.members.some((m) => m.student_id.toLowerCase().includes(q) ||
                              m.full_name.toLowerCase().includes(q))
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [teams, statusFilter, eventFilter, query]);

  async function changeStatus(id: string, status: TeamStatus) {
    const previous = teams;
    const reviewed_at = status === "pending" ? null : new Date().toISOString();

    setSaveError(null);
    setSavingId(id);
    setTeams((ts) => ts.map((t) => (t.id === id ? { ...t, status, reviewed_at } : t)));
    setDetail((d) => (d && d.id === id ? { ...d, status, reviewed_at } : d));

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("teams")
        .update({ status, reviewed_at, reviewed_by: user?.id ?? null })
        .eq("id", id);

      if (error) {
        setTeams(previous);
        setSaveError("Không cập nhật được trạng thái. Vui lòng thử lại.");
      }
    } catch {
      setTeams(previous);
      setSaveError("Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      await exportTeamsToExcel(filtered);
    } catch {
      setExportError("Không tạo được file Excel. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="recruits">
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.total}</span>
          <span className="stat-card__label">Tổng số đội</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.pending}</span>
          <span className="stat-card__label">Chờ duyệt</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.approved}</span>
          <span className="stat-card__label">Đã duyệt</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.players}</span>
          <span className="stat-card__label">Vận động viên</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar__search field">
          <label htmlFor="search" className="sr-only">Tìm theo tên đội, mã đội hoặc MSSV</label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên đội, mã đội hoặc MSSV…"
          />
        </div>

        <div className="field">
          <label htmlFor="statusFilter" className="sr-only">Lọc theo trạng thái</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TeamStatus | "all")}
          >
            <option value="all">Tất cả trạng thái</option>
            {TEAM_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{TEAM_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        {events.length > 1 && (
          <div className="field">
            <label htmlFor="eventFilter" className="sr-only">Lọc theo giải đấu</label>
            <select
              id="eventFilter"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="all">Tất cả giải đấu</option>
              {events.map(([id, title]) => (
                <option key={id} value={id}>{title}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          className="btn btn--ghost"
          onClick={handleExport}
          disabled={!filtered.length || exporting}
        >
          {exporting ? "Đang tạo file…" : "Xuất Excel"}
        </button>
      </div>

      {saveError && <p className="form-alert" role="alert">{saveError}</p>}
      {exportError && <p className="form-alert" role="alert">{exportError}</p>}

      <p className="recruits__count">
        Hiển thị {filtered.length} / {teams.length} đội
      </p>

      {filtered.length === 0 ? (
        <div className="form-card recruits__empty">
          <p>
            {teams.length === 0
              ? "Chưa có đội nào đăng ký."
              : "Không có đội nào khớp bộ lọc hiện tại."}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã đội</th>
                <th>Tên đội</th>
                <th>Giải đấu</th>
                <th>Đội trưởng</th>
                <th>Liên hệ</th>
                <th>VĐV</th>
                <th>Ngày đăng ký</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setDetail(t)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") setDetail(t); }}
                  className={savingId === t.id ? "is-saving" : undefined}
                >
                  <td data-label="Mã đội" className="mono nowrap">{t.team_code}</td>
                  <td data-label="Tên đội"><strong>{t.team_name}</strong></td>
                  <td data-label="Giải đấu">{t.event_title ?? "—"}</td>
                  <td data-label="Đội trưởng">
                    {t.captain_name}
                    <span className="cell-sub mono">{t.captain_student_id}</span>
                  </td>
                  <td data-label="Liên hệ">
                    <span className="cell-sub mono">{t.captain_phone}</span>
                    <span className="cell-sub">{t.captain_email}</span>
                  </td>
                  <td data-label="VĐV" className="mono">{t.members.length}</td>
                  <td data-label="Ngày đăng ký" className="mono nowrap">
                    {formatTeamDate(t.created_at)}
                  </td>
                  <td data-label="Trạng thái" onClick={(e) => e.stopPropagation()}>
                    <select
                      className={`status-select status-select--${statusClass(t.status)}`}
                      value={t.status}
                      disabled={savingId === t.id}
                      onChange={(e) => changeStatus(t.id, e.target.value as TeamStatus)}
                      aria-label={`Trạng thái đội ${t.team_name}`}
                    >
                      {TEAM_STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>{TEAM_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <TeamDetailDrawer
          team={detail}
          saving={savingId === detail.id}
          onClose={() => setDetail(null)}
          onChangeStatus={(status) => changeStatus(detail.id, status)}
        />
      )}
    </div>
  );
}

/** Dùng lại đúng 3 lớp màu của bảng đơn tuyển quân. */
function statusClass(status: TeamStatus): string {
  if (status === "approved") return "passed";
  if (status === "rejected") return "rejected";
  return "pending";
}

function TeamDetailDrawer({
  team,
  saving,
  onClose,
  onChangeStatus,
}: {
  team: TeamWithMembers;
  saving: boolean;
  onClose: () => void;
  onChangeStatus: (status: TeamStatus) => void;
}) {
  const captain = captainOf(team.members);

  return (
    <div
      className="drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết đội"
      onClick={onClose}
    >
      <aside className="drawer__panel" onClick={(e) => e.stopPropagation()}>
        <header className="drawer__head">
          <div>
            <h2>{team.team_name}</h2>
            <p className="mono">{team.team_code}</p>
          </div>
          <button type="button" className="drawer__close" aria-label="Đóng" onClick={onClose}>
            ×
          </button>
        </header>

        <dl className="drawer__list">
          <div><dt>Giải đấu</dt><dd>{team.event_title ?? "Chưa gắn giải"}</dd></div>
          <div><dt>Đội trưởng</dt><dd>{team.captain_name}</dd></div>
          <div><dt>MSSV đội trưởng</dt><dd className="mono">{team.captain_student_id}</dd></div>
          <div><dt>Email</dt><dd>{team.captain_email}</dd></div>
          <div><dt>Số điện thoại</dt><dd className="mono">{team.captain_phone}</dd></div>
          <div><dt>Ngày đăng ký</dt><dd className="mono">{formatTeamDate(team.created_at)}</dd></div>
          {team.reviewed_at && (
            <div><dt>Ngày duyệt</dt><dd className="mono">{formatTeamDate(team.reviewed_at)}</dd></div>
          )}
          <div className="drawer__note">
            <dt>Ghi chú của đội</dt>
            <dd>{team.note?.trim() || "Không có ghi chú."}</dd>
          </div>
        </dl>

        <h3 className="drawer__subhead">
          Đội hình <span className="mono">({team.members.length} người)</span>
        </h3>

        <ol className="roster-view">
          {team.members.map((m) => (
            <li key={m.id} className="roster-view__row">
              <div className="roster-view__main">
                <strong>{m.full_name}</strong>
                {m.id === captain?.id && <span className="captain-tag">Đội trưởng</span>}
              </div>
              <div className="roster-view__meta mono">
                <span>{m.student_id}</span>
                <span>{m.phone || "—"}</span>
                <span>{m.height_cm ? `${m.height_cm} cm` : "—"}</span>
                <span className="pos-chip" title={POSITION_LABEL[m.position]}>
                  {POSITION_SHORT[m.position]}
                </span>
              </div>
            </li>
          ))}
        </ol>

        <div className="drawer__actions">
          <button
            type="button"
            className="btn btn--solid"
            disabled={saving || team.status === "approved"}
            onClick={() => onChangeStatus("approved")}
          >
            Duyệt đội
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={saving || team.status === "rejected"}
            onClick={() => onChangeStatus("rejected")}
          >
            Từ chối
          </button>
          {team.status !== "pending" && (
            <button
              type="button"
              className="btn btn--ghost"
              disabled={saving}
              onClick={() => onChangeStatus("pending")}
            >
              Đưa về chờ duyệt
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
