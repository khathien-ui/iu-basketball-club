"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MIN_LENGTH = 8;

export default function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Liên kết trong email đã được /auth/callback đổi thành session.
  // Nếu không có session thì liên kết sai hoặc đã hết hạn.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (active) setReady(!!data.user);
      } catch {
        if (active) setReady(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    if (password.length < MIN_LENGTH) {
      setError(`Mật khẩu phải có ít nhất ${MIN_LENGTH} ký tự.`);
      return;
    }
    if (password !== confirm) {
      setError("Hai lần nhập mật khẩu không khớp.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({ password });

      if (authError) {
        setError("Không đặt lại được mật khẩu. Liên kết có thể đã hết hạn.");
        return;
      }

      setDone(true);
      router.refresh();
    } catch {
      setError("Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  if (ready === null) {
    return <div className="auth-card auth-card--center"><p>Đang kiểm tra liên kết…</p></div>;
  }

  if (ready === false) {
    return (
      <div className="auth-card auth-card--center">
        <h2>Liên kết không hợp lệ</h2>
        <p>
          Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được dùng.
          Vui lòng yêu cầu gửi lại.
        </p>
        <div className="form-done__actions">
          <a href="/forgot-password" className="btn btn--solid btn--lg">Gửi lại liên kết</a>
          <a href="/login" className="btn btn--ghost btn--lg">Về đăng nhập</a>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-card auth-card--center">
        <div className="form-done__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="m8 12.5 2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2>Đã đổi mật khẩu!</h2>
        <p>Mật khẩu mới của bạn đã được lưu. Bạn có thể vào khu vực thành viên ngay.</p>
        <div className="form-done__actions">
          <a href="/dashboard" className="btn btn--solid btn--lg">Vào Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="password">Mật khẩu mới</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null); }}
          placeholder="Ít nhất 8 ký tự"
        />
      </div>

      <div className="field">
        <label htmlFor="confirm">Nhập lại mật khẩu mới</label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(null); }}
          placeholder="••••••••"
        />
      </div>

      {error && <p className="form-alert" role="alert">{error}</p>}

      <button type="submit" className="btn btn--solid btn--lg form-submit" disabled={submitting}>
        {submitting ? "Đang lưu…" : "Đặt lại mật khẩu"}
      </button>
    </form>
  );
}
