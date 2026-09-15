"use client";

import { useEffect, useMemo, useState } from "react";
import { initialsOf, ROLE_LABEL, ROLE_ORDER, type Profile } from "@/lib/members";
import {
  ATTENDANCE_LABEL,
  formatClock,
  formatSessionDate,
  type Attendance,
  type TrainingSession,
} from "@/lib/sessions";
import {
  computeStats,
  formatRate,
  overviewOf,
  PERIOD_LABEL,
  periodFor,
  rateLevel,
  sessionsInPeriod,
  statusOf,
  todayYmd,
  type MemberStats,
  type Period,
  type PeriodKind,
  type RoleFilter,
} from "@/lib/attendanceStats";
import { exportAttendanceToExcel } from "@/lib/exportAttendance";

type SortKey = "rate" | "name" | "attended";

interface Props {
  members: Profile[];
  sessions: TrainingSession[];
  attendances: Attendance[];
}

export default function AttendanceReport({ members, sessions, attendances }: Props) {
  const [periodKind, setPeriodKind] = useState<PeriodKind>("this_month");
  const [custom, setCustom] = useState<Period>(() => periodFor("this_month"));
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rate");
  const [sortAsc, setSortAsc] = useState(false);
  const [detail, setDetail] = useState<MemberStats | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const period = periodKind === "custom" ? custom : periodFor(periodKind);

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

  const periodSessions = useMemo(
    () => sessionsInPeriod(sessions, period, todayYmd()),
    [sessions, period]
  );

  const visibleMembers = useMemo(
    () => members.filter((m) => roleFilter === "all" || m.role === roleFilter),
    [members, roleFilter]
  );

  const stats = useMemo(
    () => computeStats(visibleMembers, periodSessions, attendances),
    [visibleMembers, periodSessions, attendances]
  );

  const overview = useMemo(
    () => overviewOf(stats, periodSessions.length),
    [stats, periodSessions.length]
  );

  const sorted = useMemo(() => {
    const out = [...stats];
    out.sort((a, b) => {
      let diff: number;
      if (sortKey === "name") {
        diff = (a.member.full_name ?? "").localeCompare(b.member.full_name ?? "", "vi");
      } else if (sortKey === "attended") {
        diff = a.attended - b.attended;
      } else {
        // Người không có buổi nào để tính luôn xếp cuối.
        const ra = a.rate ?? -1;
        const rb = b.rate ?? -1;
        diff = ra - rb;
      }
      return sortAsc ? diff : -diff;
    });
    return out;
  }, [stats, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(key === "name");
    }
  }

  function sortArrow(key: SortKey) {
    if (sortKey !== key) return null;
    return <span className="sort-arrow">{sortAsc ? "▲" : "▼"}</span>;
  }

  async function handleExport() {
    setError(null);
    setExporting(true);
    try {
      await exportAttendanceToExcel(sorted, period, periodSessions.length);
    } catch (err) {
      console.error("[AttendanceReport] Xuất Excel lỗi:", err);
      setError("Không tạo được file Excel. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="recruits">
      <div className="stat-cards">
        <div className="stat-card">
          <span className={`stat-card__value mono${
            overview.averageRate !== null ? ` rate--${rateLevel(overview.averageRate)}` : ""
          }`}>
            {formatRate(overview.averageRate)}
          </span>
          <span className="stat-card__label">Chuyên cần trung bình</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{periodSessions.length}</span>
          <span className="stat-card__label">Buổi tập trong kỳ</span>
        </div>
        <div className="stat-card stat-card--top5">
          <span className="stat-card__label">Top 5 chuyên cần nhất</span>
          {overview.top5.length === 0 ? (
            <span className="field__hint">Chưa có dữ liệu.</span>
          ) : (
            <ol className="top5">
              {overview.top5.map((s, i) => (
                <li key={s.member.id}>
                  <span className="top5__rank mono">{i + 1}</span>
                  <span className="top5__name">{s.member.full_name || "(chưa đặt tên)"}</span>
                  <span className={`top5__rate mono rate--${rateLevel(s.rate ?? 0)}`}>
                    {formatRate(s.rate)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="periodKind" className="sr-only">Kỳ thống kê</label>
          <select
            id="periodKind"
            value={periodKind}
            onChange={(e) => {
              const k = e.target.value as PeriodKind;
              setPeriodKind(k);
              if (k === "custom") setCustom(periodFor("this_month"));
            }}
          >
            {(["this_month", "last_month", "custom"] as PeriodKind[]).map((k) => (
              <option key={k} value={k}>{PERIOD_LABEL[k]}</option>
            ))}
          </select>
        </div>

        {periodKind === "custom" && (
          <>
            <div className="field">
              <label htmlFor="from" className="sr-only">Từ ngày</label>
              <input id="from" type="date" value={custom.from}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="to" className="sr-only">Đến ngày</label>
              <input id="to" type="date" value={custom.to}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} />
            </div>
          </>
        )}

        <div className="field">
          <label htmlFor="roleFilter" className="sr-only">Lọc theo vai trò</label>
          <select id="roleFilter" value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}>
            <option value="all">Tất cả vai trò</option>
            {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </div>

        <button type="button" className="btn btn--ghost" onClick={handleExport}
          disabled={exporting || sorted.length === 0}>
          {exporting ? "Đang tạo file…" : "Xuất Excel"}
        </button>
      </div>

      {error && <p className="form-alert" role="alert">{error}</p>}

      <p className="recruits__count">
        {formatSessionDate(period.from)} – {formatSessionDate(period.to)} ·{" "}
        {periodSessions.length} buổi · {sorted.length} thành viên
      </p>

      {periodSessions.length === 0 ? (
        <div className="form-card recruits__empty">
          <p>Không có buổi tập nào đã diễn ra trong kỳ đã chọn.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("name")}>
                    Thành viên {sortArrow("name")}
                  </button>
                </th>
                <th>Vai trò</th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("attended")}>
                    Có mặt {sortArrow("attended")}
                  </button>
                </th>
                <th>Trễ</th>
                <th>Có phép</th>
                <th>Vắng</th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("rate")}>
                    Chuyên cần {sortArrow("rate")}
                  </button>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.member.id} onClick={() => setDetail(s)} tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") setDetail(s); }}>
                  <td data-label="Thành viên">
                    <span className="member-cell">
                      <span className="avatar">
                        {s.member.avatar_url
                          ? <img src={s.member.avatar_url} alt="" />
                          : <span>{initialsOf(s.member.full_name, s.member.email)}</span>}
                      </span>
                      <span className="member-cell__text">
                        <strong>{s.member.full_name || "(chưa đặt tên)"}</strong>
                        <em>{s.member.student_id || s.member.email}</em>
                      </span>
                    </span>
                  </td>
                  <td data-label="Vai trò">
                    <span className={`role-chip role-chip--${s.member.role}`}>
                      {ROLE_LABEL[s.member.role]}
                    </span>
                  </td>
                  <td data-label="Có mặt" className="mono">
                    {s.attended} / {s.totalSessions}
                  </td>
                  <td data-label="Trễ" className="mono">{s.late}</td>
                  <td data-label="Có phép" className="mono">{s.excused}</td>
                  <td data-label="Vắng" className="mono">{s.absent}</td>
                  <td data-label="Chuyên cần">
                    {s.rate === null ? (
                      <span className="text-faint">—</span>
                    ) : (
                      <span className={`rate-pill rate--${rateLevel(s.rate)}`}>
                        <span className="rate-pill__bar" style={{ width: `${Math.round(s.rate)}%` }} />
                        <span className="rate-pill__text mono">{formatRate(s.rate)}</span>
                      </span>
                    )}
                  </td>
                  <td data-label="" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDetail(s)}>
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="field__hint">
        Tỉ lệ chuyên cần = (đúng giờ + đi trễ) / số buổi đã diễn ra trong kỳ.
        Buổi tập trước ngày thành viên có tài khoản không được tính.
      </p>

      {detail && (
        <MemberAttendanceDrawer
          stats={detail}
          sessions={periodSessions}
          attendances={attendances}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function MemberAttendanceDrawer({
  stats, sessions, attendances, onClose,
}: {
  stats: MemberStats;
  sessions: TrainingSession[];
  attendances: Attendance[];
  onClose: () => void;
}) {
  const joinedAt = stats.member.created_at.slice(0, 10);
  const rows = sessions.filter((s) => s.session_date >= joinedAt);

  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-label="Chi tiết chuyên cần" onClick={onClose}>
      <aside className="drawer__panel" onClick={(e) => e.stopPropagation()}>
        <header className="drawer__head">
          <div>
            <h2>{stats.member.full_name || "(chưa đặt tên)"}</h2>
            <p className="mono">{stats.member.student_id || stats.member.email}</p>
          </div>
          <button type="button" className="drawer__close" aria-label="Đóng" onClick={onClose}>×</button>
        </header>

        <div className="drawer-stats">
          <div>
            <span className={`drawer-stats__value mono${stats.rate !== null ? ` rate--${rateLevel(stats.rate)}` : ""}`}>
              {formatRate(stats.rate)}
            </span>
            <span className="drawer-stats__label">Chuyên cần</span>
          </div>
          <div>
            <span className="drawer-stats__value mono">{stats.attended}/{stats.totalSessions}</span>
            <span className="drawer-stats__label">Có mặt</span>
          </div>
          <div>
            <span className="drawer-stats__value mono">{stats.late}</span>
            <span className="drawer-stats__label">Đi trễ</span>
          </div>
          <div>
            <span className="drawer-stats__value mono">{stats.absent}</span>
            <span className="drawer-stats__label">Vắng</span>
          </div>
        </div>

        <h3 className="drawer__subtitle">Từng buổi tập</h3>

        {rows.length === 0 ? (
          <p className="field__hint">Không có buổi tập nào trong kỳ tính cho thành viên này.</p>
        ) : (
          <ul className="history-list">
            {rows.map((s) => {
              const status = statusOf(attendances, s.id, stats.member.id);
              const record = attendances.find(
                (a) => a.session_id === s.id && a.member_id === stats.member.id
              );
              return (
                <li key={s.id} className="history-item">
                  <div className="history-item__main">
                    <strong>{s.title}</strong>
                    <span className="history-item__meta">
                      {formatSessionDate(s.session_date)}
                      {s.location ? ` · ${s.location}` : ""}
                    </span>
                  </div>
                  <div className="history-item__side">
                    <span className={`att-chip att-chip--${status ?? "absent"}`}>
                      {status ? ATTENDANCE_LABEL[status] : "Vắng"}
                    </span>
                    {record?.checked_in_at && (
                      <span className="history-item__time mono">
                        {formatClock(record.checked_in_at)}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );
}
