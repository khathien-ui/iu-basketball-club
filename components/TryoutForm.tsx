"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const POSITIONS = [
  { value: "PG", label: "PG — Point Guard (Hậu vệ dẫn bóng)" },
  { value: "SG", label: "SG — Shooting Guard (Hậu vệ ghi điểm)" },
  { value: "SF", label: "SF — Small Forward (Tiền phong phụ)" },
  { value: "PF", label: "PF — Power Forward (Tiền phong chính)" },
  { value: "C", label: "C — Center (Trung phong)" },
  { value: "unknown", label: "Chưa biết" },
];

const EXPERIENCES = ["Chưa từng chơi", "Dưới 1 năm", "1-3 năm", "Trên 3 năm"];

interface FormState {
  full_name: string;
  student_id: string;
  email: string;
  phone: string;
  height_cm: string;
  position: string;
  experience: string;
  note: string;
}

const EMPTY: FormState = {
  full_name: "",
  student_id: "",
  email: "",
  phone: "",
  height_cm: "",
  position: "",
  experience: "",
  note: "",
};

type Errors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): Errors {
  const e: Errors = {};

  if (!form.full_name.trim()) e.full_name = "Vui lòng nhập họ và tên.";
  if (!form.student_id.trim()) e.student_id = "Vui lòng nhập MSSV.";

  if (!form.email.trim()) {
    e.email = "Vui lòng nhập email.";
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
    e.email = "Email không đúng định dạng.";
  }

  const digits = form.phone.replace(/\D/g, "");
  if (!form.phone.trim()) {
    e.phone = "Vui lòng nhập số điện thoại.";
  } else if (digits.length !== 10) {
    e.phone = "Số điện thoại phải có đúng 10 số.";
  }

  if (!form.height_cm.trim()) {
    e.height_cm = "Vui lòng nhập chiều cao.";
  } else {
    const h = Number(form.height_cm);
    if (!Number.isFinite(h) || h < 140 || h > 230) {
      e.height_cm = "Chiều cao phải từ 140 đến 230 cm.";
    }
  }

  if (!form.position) e.position = "Vui lòng chọn vị trí mong muốn.";
  if (!form.experience) e.experience = "Vui lòng chọn kinh nghiệm chơi bóng.";

  return e;
}

export default function TryoutForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const update = (key: keyof FormState) => (
    ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [key]: ev.target.value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setSubmitError(null);
  };

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError(null);

    const found = validate(form);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const first = document.querySelector<HTMLElement>("[data-invalid='true']");
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      first?.focus({ preventScroll: true });
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("recruits").insert({
        full_name: form.full_name.trim(),
        student_id: form.student_id.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\D/g, ""),
        height_cm: Number(form.height_cm),
        position: form.position,
        experience: form.experience,
        note: form.note.trim() || null,
      });

      if (error) {
        // 23505 = unique_violation → MSSV đã tồn tại
        if (error.code === "23505") {
          setErrors((e) => ({ ...e, student_id: "MSSV này đã đăng ký rồi." }));
          setSubmitError("MSSV này đã đăng ký rồi. Mỗi sinh viên chỉ nộp đơn một lần.");
        } else {
          setSubmitError("Gửi đơn thất bại. Vui lòng thử lại sau ít phút.");
        }
        return;
      }

      setDone(true);
    } catch {
      setSubmitError(
        "Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="form-card form-done">
        <div className="form-done__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="m8 12.5 2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2>Đã nhận đơn của bạn!</h2>
        <p>
          Cảm ơn bạn đã đăng ký tuyển quân cùng CLB Bóng rổ IU. Ban điều hành sẽ
          xem xét đơn và liên hệ qua email hoặc số điện thoại bạn để lại.
        </p>
        <p className="form-done__hint">
          Trong lúc chờ, hãy theo dõi fanpage của CLB để cập nhật lịch tuyển quân,
          địa điểm tập trung và các thông báo mới nhất.
        </p>
        <div className="form-done__actions">
          <a
            href="https://www.facebook.com/IUBASKETBALLL"
            target="_blank"
            rel="noopener"
            className="btn btn--solid btn--lg"
          >
            Theo dõi fanpage CLB
          </a>
          <a href="/" className="btn btn--ghost btn--lg">Về trang chủ</a>
        </div>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="full_name">
            Họ và tên <span className="req">*</span>
          </label>
          <input
            id="full_name"
            type="text"
            value={form.full_name}
            onChange={update("full_name")}
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            data-invalid={errors.full_name ? "true" : undefined}
            aria-invalid={!!errors.full_name}
          />
          {errors.full_name && <span className="field__error">{errors.full_name}</span>}
        </div>

        <div className="field">
          <label htmlFor="student_id">
            MSSV <span className="req">*</span>
          </label>
          <input
            id="student_id"
            type="text"
            value={form.student_id}
            onChange={update("student_id")}
            placeholder="ITITIU00000"
            data-invalid={errors.student_id ? "true" : undefined}
            aria-invalid={!!errors.student_id}
          />
          {errors.student_id && <span className="field__error">{errors.student_id}</span>}
        </div>

        <div className="field">
          <label htmlFor="email">
            Email <span className="req">*</span>
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            value={form.email}
            onChange={update("email")}
            placeholder="ban@example.com"
            autoComplete="email"
            data-invalid={errors.email ? "true" : undefined}
            aria-invalid={!!errors.email}
          />
          {errors.email && <span className="field__error">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="phone">
            Số điện thoại <span className="req">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={form.phone}
            onChange={update("phone")}
            placeholder="0901234567"
            autoComplete="tel"
            data-invalid={errors.phone ? "true" : undefined}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && <span className="field__error">{errors.phone}</span>}
        </div>

        <div className="field">
          <label htmlFor="height_cm">
            Chiều cao (cm) <span className="req">*</span>
          </label>
          <input
            id="height_cm"
            type="number"
            inputMode="numeric"
            min={140}
            max={230}
            value={form.height_cm}
            onChange={update("height_cm")}
            placeholder="175"
            data-invalid={errors.height_cm ? "true" : undefined}
            aria-invalid={!!errors.height_cm}
          />
          {errors.height_cm && <span className="field__error">{errors.height_cm}</span>}
        </div>

        <div className="field">
          <label htmlFor="position">
            Vị trí mong muốn <span className="req">*</span>
          </label>
          <select
            id="position"
            value={form.position}
            onChange={update("position")}
            data-invalid={errors.position ? "true" : undefined}
            aria-invalid={!!errors.position}
          >
            <option value="">— Chọn vị trí —</option>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {errors.position && <span className="field__error">{errors.position}</span>}
        </div>

        <div className="field field--full">
          <label htmlFor="experience">
            Kinh nghiệm chơi bóng <span className="req">*</span>
          </label>
          <select
            id="experience"
            value={form.experience}
            onChange={update("experience")}
            data-invalid={errors.experience ? "true" : undefined}
            aria-invalid={!!errors.experience}
          >
            <option value="">— Chọn mức kinh nghiệm —</option>
            {EXPERIENCES.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
          {errors.experience && <span className="field__error">{errors.experience}</span>}
        </div>

        <div className="field field--full">
          <label htmlFor="note">Ghi chú <span className="opt">(không bắt buộc)</span></label>
          <textarea
            id="note"
            rows={4}
            value={form.note}
            onChange={update("note")}
            placeholder="Điều bạn muốn CLB biết thêm: lịch bận, chấn thương cũ, câu hỏi…"
          />
        </div>
      </div>

      {submitError && (
        <p className="form-alert" role="alert">{submitError}</p>
      )}

      <button type="submit" className="btn btn--solid btn--lg form-submit" disabled={submitting}>
        {submitting ? "Đang gửi đơn…" : "Gửi đơn đăng ký"}
      </button>

      <p className="form-note">
        Các trường có dấu <span className="req">*</span> là bắt buộc. Thông tin của bạn
        chỉ được ban điều hành CLB sử dụng cho mục đích tuyển quân.
      </p>
    </form>
  );
}
