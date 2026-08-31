"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Email không đúng định dạng.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }
      );

      if (authError) {
        setError("Không gửi được email đặt lại mật khẩu. Vui lòng thử lại sau.");
        return;
      }

      setSent(true);
    } catch {
      setError("Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-card auth-card--center">
        <div className="form-done__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="m3.5 6.5 8.5 6 8.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h2>Đã gửi email!</h2>
        <p>
          Nếu email <strong>{email.trim()}</strong> có tài khoản trong hệ thống,
          bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút.
        </p>
        <p className="form-note">
          Không thấy email? Kiểm tra thư mục spam hoặc thử gửi lại.
        </p>
        <div className="form-done__actions">
          <a href="/login" className="btn btn--ghost btn--lg">Về trang đăng nhập</a>
        </div>
      </div>
    );
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="email">Email tài khoản</label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          placeholder="ban@example.com"
          aria-invalid={!!error}
        />
      </div>

      {error && <p className="form-alert" role="alert">{error}</p>}

      <button type="submit" className="btn btn--solid btn--lg form-submit" disabled={submitting}>
        {submitting ? "Đang gửi…" : "Gửi liên kết đặt lại"}
      </button>

      <div className="auth-links">
        <a href="/login">← Quay lại đăng nhập</a>
      </div>
    </form>
  );
}
