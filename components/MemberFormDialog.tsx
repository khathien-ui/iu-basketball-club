"use client";

import { useState } from "react";
import { ROLE_LABEL, ROLE_ORDER, type UserRole } from "@/lib/members";
import { POSITION_LABEL, POSITION_ORDER, type RecruitPosition } from "@/lib/recruits";

export interface MemberDraft {
  email: string;
  full_name: string;
  student_id: string;
  phone: string;
  position: RecruitPosition;
  height_cm: string;
  joined_year: string;
}

export interface CreateResult {
  email: string;
  temp_password: string;
  email_sent: boolean;
  email_error: string | null;
}

interface Props {
  title: string;
  /** Dữ liệu điền sẵn khi kết nạp từ đơn tuyển quân. */
  initial?: Partial<MemberDraft>;
  /** Khoá các trường đã lấy từ đơn (chỉ cho chọn vai trò). */
  lockPrefilled?: boolean;
  recruitId?: string;
  onClose: () => void;
  onCreated: (result: CreateResult) => void;
}

const EMPTY: MemberDraft = {
  email: "", full_name: "", student_id: "", phone: "",
  position: "unknown", height_cm: "", joined_year: String(new Date().getFullYear()),
};

export default function MemberFormDialog({
  title, initial, lockPrefilled = false, recruitId, onClose, onCreated,
}: Props) {
  const [form, setForm] = useState<MemberDraft>({ ...EMPTY, ...initial });
  const [role, setRole] = useState<UserRole>("member");
  const [sendEmail, setSendEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof MemberDraft>(key: K, value: MemberDraft[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      setError("Email không đúng định dạng.");
      return;
    }
    if (!form.full_name.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          full_name: form.full_name.trim(),
          student_id: form.student_id.trim() || null,
          phone: form.phone.trim() || null,
          position: form.position,
          height_cm: form.height_cm || null,
          joined_year: form.joined_year || null,
          role,
          send_email: sendEmail,
          recruit_id: recruitId ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không tạo được tài khoản.");
        return;
      }
      onCreated(data as CreateResult);
    } catch {
      setError("Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  const readOnly = lockPrefilled;

  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <aside className="drawer__panel" onClick={(e) => e.stopPropagation()}>
        <header className="drawer__head">
          <div><h2>{title}</h2></div>
          <button type="button" className="drawer__close" aria-label="Đóng" onClick={onClose}>×</button>
        </header>

        <form onSubmit={handleSubmit} className="drawer__form" noValidate>
          <div className="form-grid">
            <div className="field field--full">
              <label htmlFor="m_email">Email <span className="req">*</span></label>
              <input id="m_email" type="email" value={form.email} readOnly={readOnly}
                onChange={(e) => update("email", e.target.value)} placeholder="ban@example.com" />
            </div>
            <div className="field field--full">
              <label htmlFor="m_name">Họ và tên <span className="req">*</span></label>
              <input id="m_name" value={form.full_name} readOnly={readOnly}
                onChange={(e) => update("full_name", e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div className="field">
              <label htmlFor="m_sid">MSSV</label>
              <input id="m_sid" value={form.student_id} readOnly={readOnly}
                onChange={(e) => update("student_id", e.target.value)} placeholder="ITITIU00000" />
            </div>
            <div className="field">
              <label htmlFor="m_phone">Số điện thoại</label>
              <input id="m_phone" value={form.phone} readOnly={readOnly}
                onChange={(e) => update("phone", e.target.value)} placeholder="0901234567" />
            </div>
            <div className="field">
              <label htmlFor="m_pos">Vị trí</label>
              <select id="m_pos" value={form.position} disabled={readOnly}
                onChange={(e) => update("position", e.target.value as RecruitPosition)}>
                {POSITION_ORDER.map(p => <option key={p} value={p}>{POSITION_LABEL[p]}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="m_height">Chiều cao (cm)</label>
              <input id="m_height" type="number" min={100} max={250} value={form.height_cm} readOnly={readOnly}
                onChange={(e) => update("height_cm", e.target.value)} placeholder="175" />
            </div>
            <div className="field">
              <label htmlFor="m_year">Năm vào CLB</label>
              <input id="m_year" type="number" min={2000} max={2100} value={form.joined_year}
                onChange={(e) => update("joined_year", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="m_role">Vai trò <span className="req">*</span></label>
              <select id="m_role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                {ROLE_ORDER.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
          </div>

          <label className="switch">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
            <span>Gửi email tự động kèm mật khẩu tạm</span>
          </label>
          <p className="field__hint">
            Tắt nếu bạn muốn tự gửi thông tin đăng nhập cho thành viên.
            Mật khẩu tạm sẽ hiện ngay sau khi tạo.
          </p>

          {error && <p className="form-alert" role="alert">{error}</p>}

          <button type="submit" className="btn btn--solid btn--lg form-submit" disabled={submitting}>
            {submitting ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
          </button>
        </form>
      </aside>
    </div>
  );
}
