"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  combineToIso,
  formatSessionDate,
  weeklyDates,
  WEEKDAYS,
} from "@/lib/sessions";

/** Mặc định: mở check-in 15 phút trước giờ bắt đầu, đóng vào giờ kết thúc. */
const DEFAULT_OPEN_OFFSET = -15;

interface Props {
  mode: "single" | "weekly";
  onClose: () => void;
  onCreated: (count: number) => void;
  onError: (message: string) => void;
}

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function SessionFormDialog({ mode, onClose, onCreated, onError }: Props) {
  const weekly = mode === "weekly";

  const [title, setTitle] = useState(weekly ? "Tập luyện hàng tuần" : "Tập luyện");
  const [date, setDate] = useState(todayLocal());
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [location, setLocation] = useState("Nhà thi đấu IU");
  const [note, setNote] = useState("");

  // Lịch lặp
  const [weekday, setWeekday] = useState(2); // thứ Ba
  const [weeks, setWeeks] = useState(8);

  // Khoảng check-in (chỉ hiện ở chế độ tạo đơn lẻ, cho phép chỉnh tay)
  const [customWindow, setCustomWindow] = useState(false);
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewDates = weekly ? weeklyDates(date, weekday, weeks) : [date];

  function defaultWindow(d: string) {
    return {
      opens: combineToIso(d, startTime, DEFAULT_OPEN_OFFSET),
      closes: endTime ? combineToIso(d, endTime) : null,
    };
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Vui lòng nhập tiêu đề buổi tập."); return; }
    if (!date) { setError("Vui lòng chọn ngày."); return; }
    if (!startTime) { setError("Vui lòng nhập giờ bắt đầu."); return; }
    if (endTime && endTime <= startTime) {
      setError("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }
    if (weekly && (weeks < 1 || weeks > 26)) {
      setError("Số tuần phải từ 1 đến 26.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let created = 0;
      // Tạo tuần tự: mỗi mã phải khác các buổi đang mở, kể cả buổi vừa tạo
      // trong chính vòng lặp này.
      for (const d of previewDates) {
        const { data: code, error: codeError } = await supabase.rpc("generate_checkin_code");
        if (codeError || !code) {
          throw new Error(codeError?.message ?? "Không sinh được mã điểm danh.");
        }

        const win = customWindow && !weekly
          ? {
              opens: opensAt ? new Date(opensAt).toISOString() : null,
              closes: closesAt ? new Date(closesAt).toISOString() : null,
            }
          : defaultWindow(d);

        const { error: insertError } = await supabase.from("training_sessions").insert({
          title: title.trim(),
          session_date: d,
          start_time: startTime,
          end_time: endTime || null,
          location: location.trim() || null,
          note: note.trim() || null,
          checkin_code: code,
          checkin_opens_at: win.opens,
          checkin_closes_at: win.closes,
          created_by: user?.id ?? null,
        });

        if (insertError) {
          if (insertError.code === "42501") {
            throw new Error("Bạn không có quyền tạo buổi tập.");
          }
          throw new Error(insertError.message);
        }
        created++;
      }

      onCreated(created);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[SessionFormDialog] Tạo buổi tập lỗi:", err);
      setError("Không tạo được buổi tập. " + message);
      onError("Không tạo được buổi tập.");
    } finally {
      setSubmitting(false);
    }
  }

  function fillDefaultWindow() {
    const win = defaultWindow(date);
    const toLocal = (iso: string | null) => {
      if (!iso) return "";
      const dt = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    };
    setOpensAt(toLocal(win.opens));
    setClosesAt(toLocal(win.closes));
  }

  return (
    <div
      className="drawer"
      role="dialog"
      aria-modal="true"
      aria-label={weekly ? "Tạo lịch hàng tuần" : "Tạo buổi tập"}
      onClick={onClose}
    >
      <aside className="drawer__panel" onClick={(e) => e.stopPropagation()}>
        <header className="drawer__head">
          <div><h2>{weekly ? "Tạo lịch hàng tuần" : "Tạo buổi tập"}</h2></div>
          <button type="button" className="drawer__close" aria-label="Đóng" onClick={onClose}>×</button>
        </header>

        <form onSubmit={handleSubmit} className="drawer__form" noValidate>
          <div className="form-grid">
            <div className="field field--full">
              <label htmlFor="s_title">Tiêu đề <span className="req">*</span></label>
              <input id="s_title" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Tập luyện thứ Ba" />
            </div>

            {weekly ? (
              <>
                <div className="field">
                  <label htmlFor="s_weekday">Thứ trong tuần</label>
                  <select id="s_weekday" value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
                    {WEEKDAYS.map((w) => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="s_weeks">Số tuần</label>
                  <input id="s_weeks" type="number" min={1} max={26} value={weeks}
                    onChange={(e) => setWeeks(Number(e.target.value))} />
                </div>
                <div className="field field--full">
                  <label htmlFor="s_from">Bắt đầu từ ngày</label>
                  <input id="s_from" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  <span className="field__hint">
                    Buổi đầu tiên là ngày {WEEKDAYS.find((w) => w.value === weekday)?.label} đầu tiên kể từ ngày này.
                  </span>
                </div>
              </>
            ) : (
              <div className="field field--full">
                <label htmlFor="s_date">Ngày <span className="req">*</span></label>
                <input id="s_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            )}

            <div className="field">
              <label htmlFor="s_start">Giờ bắt đầu <span className="req">*</span></label>
              <input id="s_start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="s_end">Giờ kết thúc</label>
              <input id="s_end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>

            <div className="field field--full">
              <label htmlFor="s_loc">Địa điểm</label>
              <input id="s_loc" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="Nhà thi đấu IU" />
            </div>

            <div className="field field--full">
              <label htmlFor="s_note">Ghi chú</label>
              <textarea id="s_note" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Nội dung buổi tập, lưu ý cho thành viên…" />
            </div>
          </div>

          {!weekly && (
            <>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={customWindow}
                  onChange={(e) => {
                    setCustomWindow(e.target.checked);
                    if (e.target.checked) fillDefaultWindow();
                  }}
                />
                <span>Tự đặt khoảng thời gian check-in</span>
              </label>

              {customWindow ? (
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="s_open">Mở check-in lúc</label>
                    <input id="s_open" type="datetime-local" value={opensAt}
                      onChange={(e) => setOpensAt(e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="s_close">Đóng check-in lúc</label>
                    <input id="s_close" type="datetime-local" value={closesAt}
                      onChange={(e) => setClosesAt(e.target.value)} />
                  </div>
                </div>
              ) : (
                <p className="field__hint">
                  Mặc định: mở trước giờ bắt đầu 15 phút, đóng vào giờ kết thúc.
                </p>
              )}
            </>
          )}

          {weekly && (
            <div className="preview-dates">
              <strong>Sẽ tạo {previewDates.length} buổi:</strong>
              <ul>
                {previewDates.slice(0, 5).map((d) => (
                  <li key={d}>{formatSessionDate(d)}</li>
                ))}
                {previewDates.length > 5 && <li>… và {previewDates.length - 5} buổi nữa</li>}
              </ul>
              <span className="field__hint">
                Mỗi buổi có mã riêng, check-in mở trước giờ bắt đầu 15 phút.
              </span>
            </div>
          )}

          {error && <p className="form-alert" role="alert">{error}</p>}

          <button type="submit" className="btn btn--solid btn--lg form-submit" disabled={submitting}>
            {submitting
              ? "Đang tạo…"
              : weekly ? `Tạo ${previewDates.length} buổi tập` : "Tạo buổi tập"}
          </button>
        </form>
      </aside>
    </div>
  );
}
