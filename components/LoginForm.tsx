"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("email not confirmed")) {
          setError("Tài khoản chưa xác nhận email. Vui lòng kiểm tra hộp thư.");
        } else {
          setError("Email hoặc mật khẩu không đúng.");
        }
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="email">Email</label>
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

      <div className="field">
        <label htmlFor="password">Mật khẩu</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null); }}
          placeholder="••••••••"
          aria-invalid={!!error}
        />
      </div>

      {error && <p className="form-alert" role="alert">{error}</p>}

      <button type="submit" className="btn btn--solid btn--lg form-submit" disabled={submitting}>
        {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>

      <div className="auth-links">
        <a href="/forgot-password">Quên mật khẩu?</a>
      </div>

      <p className="form-note">
        Tài khoản thành viên do ban điều hành CLB cấp. Nếu bạn chưa có tài khoản,
        vui lòng liên hệ ban điều hành qua fanpage.
      </p>
    </form>
  );
}
