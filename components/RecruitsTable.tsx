"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  formatDate,
  POSITION_LABEL,
  POSITION_ORDER,
  POSITION_SHORT,
  STATUS_LABEL,
  STATUS_ORDER,
  type Recruit,
  type RecruitPosition,
  type RecruitStatus,
} from "@/lib/recruits";
import { exportRecruitsToExcel } from "@/lib/exportRecruits";

interface Props {
  initialRecruits: Recruit[];
}

export default function RecruitsTable({ initialRecruits }: Props) {
  const [recruits, setRecruits] = useState<Recruit[]>(initialRecruits);
  const [statusFilter, setStatusFilter] = useState<RecruitStatus | "all">("all");
  const [positionFilter, setPositionFilter] = useState<RecruitPosition | "all">("all");
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Recruit | null>(null);

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
    total: recruits.length,
    pending: recruits.filter((r) => r.status === "pending").length,
    passed: recruits.filter((r) => r.status === "passed").length,
  }), [recruits]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recruits
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      .filter((r) => positionFilter === "all" || r.position === positionFilter)
      .filter((r) =>
        !q ||
        r.full_name.toLowerCase().includes(q) ||
        r.student_id.toLowerCase().includes(q)
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [recruits, statusFilter, positionFilter, query]);

  async function changeStatus(id: string, status: RecruitStatus) {
    const previous = recruits;
    setSaveError(null);
    setSavingId(id);
    setRecruits((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    setDetail((d) => (d && d.id === id ? { ...d, status } : d));

    try {
      const supabase = createClient();
      const { error } = await supabase.from("recruits").update({ status }).eq("id", id);
      if (error) {
        setRecruits(previous);
        setSaveError("Không cập nhật được trạng thái. Vui lòng thử lại.");
      }
    } catch {
      setRecruits(previous);
      setSaveError("Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      await exportRecruitsToExcel(filtered);
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
          <span className="stat-card__label">Tổng đơn</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.pending}</span>
          <span className="stat-card__label">Chờ duyệt</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.passed}</span>
          <span className="stat-card__label">Đậu</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar__search field">
          <label htmlFor="search" className="sr-only">Tìm theo tên hoặc MSSV</label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc MSSV…"
          />
        </div>

        <div className="field">
          <label htmlFor="statusFilter" className="sr-only">Lọc theo trạng thái</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RecruitStatus | "all")}
          >
            <option value="all">Tất cả trạng thái</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="positionFilter" className="sr-only">Lọc theo vị trí</label>
          <select
            id="positionFilter"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value as RecruitPosition | "all")}
          >
            <option value="all">Tất cả vị trí</option>
            {POSITION_ORDER.map((p) => (
              <option key={p} value={p}>{POSITION_LABEL[p]}</option>
            ))}
          </select>
        </div>

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
        Hiển thị {filtered.length} / {recruits.length} đơn
      </p>

      {filtered.length === 0 ? (
        <div className="form-card recruits__empty">
          <p>
            {recruits.length === 0
              ? "Chưa có đơn đăng ký nào."
              : "Không có đơn nào khớp bộ lọc hiện tại."}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ và tên</th>
                <th>MSSV</th>
                <th>SĐT</th>
                <th>Cao</th>
                <th>Vị trí</th>
                <th>Kinh nghiệm</th>
                <th>Ngày đăng ký</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setDetail(r)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") setDetail(r); }}
                  className={savingId === r.id ? "is-saving" : undefined}
                >
                  <td data-label="Họ và tên"><strong>{r.full_name}</strong></td>
                  <td data-label="MSSV" className="mono">{r.student_id}</td>
                  <td data-label="SĐT" className="mono">{r.phone || "—"}</td>
                  <td data-label="Chiều cao" className="mono">{r.height_cm ?? "—"}</td>
                  <td data-label="Vị trí">
                    <span className="pos-chip">{POSITION_SHORT[r.position]}</span>
                  </td>
                  <td data-label="Kinh nghiệm">{r.experience || "—"}</td>
                  <td data-label="Ngày đăng ký" className="mono nowrap">{formatDate(r.created_at)}</td>
                  <td data-label="Trạng thái" onClick={(e) => e.stopPropagation()}>
                    <select
                      className={`status-select status-select--${r.status}`}
                      value={r.status}
                      disabled={savingId === r.id}
                      onChange={(e) => changeStatus(r.id, e.target.value as RecruitStatus)}
                      aria-label={`Trạng thái đơn của ${r.full_name}`}
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
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
        <div className="drawer" role="dialog" aria-modal="true" aria-label="Chi tiết đơn" onClick={() => setDetail(null)}>
          <aside className="drawer__panel" onClick={(e) => e.stopPropagation()}>
            <header className="drawer__head">
              <div>
                <h2>{detail.full_name}</h2>
                <p className="mono">{detail.student_id}</p>
              </div>
              <button type="button" className="drawer__close" aria-label="Đóng" onClick={() => setDetail(null)}>
                ×
              </button>
            </header>

            <dl className="drawer__list">
              <div><dt>Email</dt><dd>{detail.email}</dd></div>
              <div><dt>Số điện thoại</dt><dd className="mono">{detail.phone || "—"}</dd></div>
              <div><dt>Chiều cao</dt><dd className="mono">{detail.height_cm ? `${detail.height_cm} cm` : "—"}</dd></div>
              <div><dt>Vị trí mong muốn</dt><dd>{POSITION_LABEL[detail.position]}</dd></div>
              <div><dt>Kinh nghiệm</dt><dd>{detail.experience || "—"}</dd></div>
              <div><dt>Ngày đăng ký</dt><dd className="mono">{formatDate(detail.created_at)}</dd></div>
              <div className="drawer__note">
                <dt>Ghi chú</dt>
                <dd>{detail.note?.trim() || "Không có ghi chú."}</dd>
              </div>
            </dl>

            <div className="field">
              <label htmlFor="detailStatus">Trạng thái đơn</label>
              <select
                id="detailStatus"
                value={detail.status}
                disabled={savingId === detail.id}
                onChange={(e) => changeStatus(detail.id, e.target.value as RecruitStatus)}
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
