"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initialsOf, type Profile } from "@/lib/members";
import {
  ATTENDANCE_LABEL,
  formatClock,
  formatCountdown,
  formatRange,
  formatSessionDate,
  sessionState,
  STATE_LABEL,
  type Attendance,
  type AttendanceStatus,
  type TrainingSession,
} from "@/lib/sessions";

const POLL_MS = 5000;

interface Props {
  initialSession: TrainingSession;
  members: Profile[];
  initialAttendances: Attendance[];
  currentUserId: string;
}

export default function SessionDetail({
  initialSession, members, initialAttendances, currentUserId,
}: Props) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [attendances, setAttendances] = useState(initialAttendances);
  const [projecting, setProjecting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const state = sessionState(session, now);

  // Đồng hồ cho đếm ngược và trạng thái.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /** Tải lại danh sách check-in — dùng cho polling khi đang chiếu mã. */
  const refreshAttendances = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("attendances")
        .select("id, session_id, member_id, checked_in_at, status, marked_by, note")
        .eq("session_id", session.id);
      if (data) setAttendances(data as Attendance[]);
    } catch {
      // im lặng: polling nền, lỗi mạng tạm thời không cần báo
    }
  }, [session.id]);

  // Chỉ poll khi còn ý nghĩa: đang mở check-in hoặc đang chiếu mã.
  useEffect(() => {
    if (state !== "open" && !projecting) return;
    const t = setInterval(refreshAttendances, POLL_MS);
    return () => clearInterval(t);
  }, [state, projecting, refreshAttendances]);

  const byMember = useMemo(() => {
    const map = new Map<string, Attendance>();
    for (const a of attendances) map.set(a.member_id, a);
    return map;
  }, [attendances]);

  const checkedIn = attendances.filter((a) => a.status === "present" || a.status === "late").length;

  const closesInMs = session.checkin_closes_at
    ? new Date(session.checkin_closes_at).getTime() - now
    : null;

  async function markAttendance(member: Profile, status: AttendanceStatus) {
    setAlert(null);
    setBusyId(member.id);
    try {
      const supabase = createClient();
      const existing = byMember.get(member.id);

      if (existing) {
        const { error } = await supabase
          .from("attendances")
          .update({ status, marked_by: currentUserId })
          .eq("id", existing.id);
        if (error) throw error;
        setAttendances((as) =>
          as.map((a) => (a.id === existing.id ? { ...a, status, marked_by: currentUserId } : a))
        );
      } else {
        const { data, error } = await supabase
          .from("attendances")
          .insert({
            session_id: session.id,
            member_id: member.id,
            status,
            marked_by: currentUserId,
            checked_in_at: status === "excused" || status === "absent" ? null : new Date().toISOString(),
          })
          .select("id, session_id, member_id, checked_in_at, status, marked_by, note")
          .single();
        if (error) throw error;
        if (data) setAttendances((as) => [...as, data as Attendance]);
      }
      router.refresh();
    } catch (err) {
      const e = err as { code?: string; message?: string };
      console.error("[SessionDetail] Điểm danh hộ lỗi:", err);
      setAlert({
        kind: "error",
        text: e.code === "42501"
          ? "Bạn không có quyền điểm danh hộ."
          : "Không lưu được điểm danh. Vui lòng thử lại.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function removeAttendance(member: Profile) {
    const existing = byMember.get(member.id);
    if (!existing) return;
    setBusyId(member.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("attendances").delete().eq("id", existing.id);
      if (error) throw error;
      setAttendances((as) => as.filter((a) => a.id !== existing.id));
      router.refresh();
    } catch (err) {
      console.error("[SessionDetail] Xoá điểm danh lỗi:", err);
      setAlert({ kind: "error", text: "Không xoá được bản ghi điểm danh." });
    } finally {
      setBusyId(null);
    }
  }

  async function regenerateCode() {
    setAlert(null);
    try {
      const supabase = createClient();
      const { data: code, error: rpcError } = await supabase.rpc("generate_checkin_code");
      if (rpcError || !code) throw rpcError ?? new Error("Không sinh được mã.");

      const { error } = await supabase
        .from("training_sessions")
        .update({ checkin_code: code })
        .eq("id", session.id);
      if (error) throw error;

      setSession((s) => ({ ...s, checkin_code: code as string }));
      setAlert({ kind: "success", text: "Đã đổi mã điểm danh. Mã cũ không dùng được nữa." });
      router.refresh();
    } catch (err) {
      console.error("[SessionDetail] Đổi mã lỗi:", err);
      setAlert({ kind: "error", text: "Không đổi được mã điểm danh." });
    }
  }

  async function closeCheckin() {
    setAlert(null);
    try {
      const iso = new Date().toISOString();
      const supabase = createClient();
      const { error } = await supabase
        .from("training_sessions")
        .update({ checkin_closes_at: iso })
        .eq("id", session.id);
      if (error) throw error;

      setSession((s) => ({ ...s, checkin_closes_at: iso }));
      setProjecting(false);
      setAlert({ kind: "success", text: "Đã đóng check-in." });
      router.refresh();
    } catch (err) {
      console.error("[SessionDetail] Đóng check-in lỗi:", err);
      setAlert({ kind: "error", text: "Không đóng được check-in." });
    }
  }

  return (
    <div className="session-detail">
      <a href="/dashboard/sessions" className="back-link">← Danh sách buổi tập</a>

      <p className="eyebrow">{STATE_LABEL[state]}</p>
      <h1 className="section__title">{session.title}</h1>
      <p className="section__lede">
        {formatSessionDate(session.session_date)} · {formatRange(session.start_time, session.end_time)}
        {session.location ? ` · ${session.location}` : ""}
      </p>

      {alert && (
        <p className={alert.kind === "error" ? "form-alert" : "form-success"} role="alert">
          {alert.text}
        </p>
      )}

      <div className="code-panel">
        <div className="code-panel__main">
          <span className="code-panel__label">Mã điểm danh</span>
          <span className="code-panel__code mono">{session.checkin_code}</span>
          <span className="code-panel__meta">
            {state === "open" && closesInMs !== null && closesInMs > 0 && (
              <>Còn <strong className="mono">{formatCountdown(closesInMs)}</strong> để check-in</>
            )}
            {state === "upcoming" && session.checkin_opens_at && (
              <>Mở check-in lúc <strong>{formatClock(session.checkin_opens_at)}</strong></>
            )}
            {state === "closed" && <>Check-in đã đóng</>}
          </span>
        </div>

        <div className="code-panel__stats">
          <span className="code-panel__count mono">{checkedIn}</span>
          <span className="code-panel__total">/ {members.length} đã check-in</span>
        </div>
      </div>

      <div className="session-actions">
        <button type="button" className="btn btn--solid" onClick={() => setProjecting(true)}>
          Hiện mã toàn màn hình
        </button>
        <button type="button" className="btn btn--ghost" onClick={regenerateCode}>
          Đổi mã
        </button>
        {state === "open" && (
          <button type="button" className="btn btn--danger" onClick={closeCheckin}>
            Đóng check-in sớm
          </button>
        )}
      </div>

      <h2 className="session-detail__subtitle">Danh sách điểm danh</h2>
      <p className="recruits__count">
        {checkedIn} đã check-in · {members.length - checkedIn} chưa check-in
      </p>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Thành viên</th>
              <th>Giờ check-in</th>
              <th>Trạng thái</th>
              <th>Điểm danh hộ</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const a = byMember.get(m.id);
              return (
                <tr key={m.id} className={busyId === m.id ? "is-saving" : undefined}>
                  <td data-label="Thành viên">
                    <span className="member-cell">
                      <span className="avatar">
                        {m.avatar_url
                          ? <img src={m.avatar_url} alt="" />
                          : <span>{initialsOf(m.full_name, m.email)}</span>}
                      </span>
                      <span className="member-cell__text">
                        <strong>{m.full_name || "(chưa đặt tên)"}</strong>
                        <em>{m.student_id || m.email}</em>
                      </span>
                    </span>
                  </td>
                  <td data-label="Giờ check-in" className="mono">
                    {a?.checked_in_at ? formatClock(a.checked_in_at) : "—"}
                  </td>
                  <td data-label="Trạng thái">
                    {a ? (
                      <span className={`att-chip att-chip--${a.status}`}>
                        {ATTENDANCE_LABEL[a.status]}
                        {a.marked_by && <span className="att-chip__by" title="Ban điều hành điểm danh hộ">*</span>}
                      </span>
                    ) : (
                      <span className="text-faint">Chưa check-in</span>
                    )}
                  </td>
                  <td data-label="Điểm danh hộ">
                    <div className="mark-actions">
                      <button type="button" className="btn btn--ghost btn--sm"
                        disabled={busyId === m.id} onClick={() => markAttendance(m, "present")}>
                        Có mặt
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm"
                        disabled={busyId === m.id} onClick={() => markAttendance(m, "late")}>
                        Trễ
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm"
                        disabled={busyId === m.id} onClick={() => markAttendance(m, "excused")}>
                        Có phép
                      </button>
                      {a && (
                        <button type="button" className="btn btn--ghost btn--sm"
                          disabled={busyId === m.id} onClick={() => removeAttendance(m)}>
                          Xoá
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="field__hint">
        Dấu <strong>*</strong> nghĩa là bản ghi do ban điều hành điểm danh hộ, không phải thành viên tự nhập mã.
      </p>

      {projecting && (
        <ProjectionScreen
          code={session.checkin_code}
          title={session.title}
          checkedIn={checkedIn}
          total={members.length}
          closesInMs={closesInMs}
          onClose={() => setProjecting(false)}
        />
      )}
    </div>
  );
}

function ProjectionScreen({
  code, title, checkedIn, total, closesInMs, onClose,
}: {
  code: string;
  title: string;
  checkedIn: number;
  total: number;
  closesInMs: number | null;
  onClose: () => void;
}) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";

    // Giữ màn hình luôn sáng khi đặt điện thoại ở sân (nếu trình duyệt hỗ trợ).
    (async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock?.request("screen");
      } catch {
        // không hỗ trợ hoặc bị từ chối — bỏ qua
      }
    })();

    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
      wakeLockRef.current?.release().catch(() => {});
    };
  }, [onClose]);

  const expired = closesInMs !== null && closesInMs <= 0;

  return (
    <div className="projection" role="dialog" aria-modal="true" aria-label="Mã điểm danh">
      <button type="button" className="projection__close" aria-label="Thoát" onClick={onClose}>×</button>

      <p className="projection__title">{title}</p>
      <p className="projection__hint">Nhập mã này trong ứng dụng để điểm danh</p>

      <div className="projection__code mono">{code}</div>

      <div className="projection__footer">
        <div className="projection__stat">
          <span className="projection__stat-value mono">{checkedIn}<span className="projection__stat-total">/{total}</span></span>
          <span className="projection__stat-label">đã check-in</span>
        </div>

        {closesInMs !== null && (
          <div className="projection__stat">
            <span className={`projection__stat-value mono${expired ? " is-expired" : ""}`}>
              {expired ? "Đã đóng" : formatCountdown(closesInMs)}
            </span>
            <span className="projection__stat-label">
              {expired ? "hết giờ check-in" : "còn lại"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
