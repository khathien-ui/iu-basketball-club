"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateNewPassword } from "@/lib/password";

export default function ChangePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    const invalid = validateNewPassword(password, confirm);
    if (invalid) {
      setError(invalid);
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) {
        setError(
          authError.message.toLowerCase().includes("different from the old")
            ? "Mật khẩu mới phải khác mật khẩu tạm."
            : "Không đổi được mật khẩu. Vui lòng thử lại."
        );
        return;
      }

      // Tắt cờ bắt buộc đổi mật khẩu qua RPC security definer
      // (member không được phép tự sửa cột này bằng UPDATE thường).
      const { error: rpcError } = await supabase.rpc("mark_password_changed");
      if (rpcError) {
        console.error("[change-password] mark_password_changed lỗi:", rpcError);
        setError("Đã đổi mật khẩu nhưng chưa cập nhật được trạng thái. Vui lòng tải lại trang.");
        return;
      }

      router.push("/dashboard");
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
        <label htmlFor="password">Mật khẩu mới</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null); }}
          placeholder="Ít nhất 8 ký tự, có chữ hoa và số"
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
        {submitting ? "Đang lưu…" : "Đặt mật khẩu mới"}
      </button>
    </form>
  );
}
