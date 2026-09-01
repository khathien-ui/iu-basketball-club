"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AvatarUpload from "./AvatarUpload";
import { validateNewPassword } from "@/lib/password";
import { initialsOf, ROLE_LABEL, type Profile } from "@/lib/members";
import { POSITION_LABEL } from "@/lib/recruits";

const ADMIN_ONLY_NOTE = "Liên hệ ban điều hành để thay đổi.";

interface Props {
  profile: Profile;
}

export default function ProfileForm({ profile }: Props) {
  const [current, setCurrent] = useState(profile);

  return (
    <div className="profile">
      <ProfileCard profile={current} onChange={setCurrent} />
      <PasswordCard />
    </div>
  );
}

function ProfileCard({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (p: Profile) => void;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  /** Chỉ hai trường này member được tự sửa (khớp trigger ở migration 002). */
  async function persist(patch: Partial<Pick<Profile, "phone" | "avatar_url">>) {
    setError(null);
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", profile.id);

      if (dbError) {
        console.error("[profile] Lưu thất bại:", dbError);
        setError(
          dbError.code === "42501"
            ? "Bạn chỉ được cập nhật số điện thoại và ảnh đại diện."
            : "Không lưu được thay đổi. Vui lòng thử lại."
        );
        return false;
      }

      onChange({ ...profile, ...patch });
      router.refresh();
      return true;
    } catch {
      setError("Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSaved(false);

    const digits = phone.replace(/\D/g, "");
    if (phone.trim() && digits.length !== 10) {
      setError("Số điện thoại phải có đúng 10 số.");
      return;
    }

    const ok = await persist({ phone: digits || null });
    if (ok) setSaved(true);
  }

  return (
    <section className="form-card profile-card">
      <h2 className="profile-card__title">Thông tin cá nhân</h2>

      <AvatarUpload
        userId={profile.id}
        currentUrl={profile.avatar_url}
        fallback={initialsOf(profile.full_name, profile.email)}
        onUploaded={(url) => persist({ avatar_url: url })}
      />

      <form onSubmit={handleSubmit} className="drawer__form" noValidate>
        <div className="form-grid">
          {/* Sửa được */}
          <div className="field field--full">
            <label htmlFor="p_phone">Số điện thoại</label>
            <input
              id="p_phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(null); setSaved(false); }}
              placeholder="0901234567"
            />
            <span className="field__hint">Bạn có thể tự cập nhật số điện thoại.</span>
          </div>

          {/* Chỉ đọc */}
          <ReadOnlyField id="p_name" label="Họ và tên" value={profile.full_name || "—"} />
          <ReadOnlyField id="p_sid" label="MSSV" value={profile.student_id || "—"} mono />
          <ReadOnlyField id="p_email" label="Email" value={profile.email || "—"} full />
          <ReadOnlyField id="p_pos" label="Vị trí" value={POSITION_LABEL[profile.position]} />
          <ReadOnlyField
            id="p_height"
            label="Chiều cao (cm)"
            value={profile.height_cm ? String(profile.height_cm) : "—"}
            mono
          />
          <ReadOnlyField
            id="p_year"
            label="Năm vào CLB"
            value={profile.joined_year ? String(profile.joined_year) : "—"}
            mono
          />
          <ReadOnlyField id="p_role" label="Vai trò" value={ROLE_LABEL[profile.role]} />
        </div>

        <p className="profile-card__note">
          Các trường không sửa được do ban điều hành quản lý. {ADMIN_ONLY_NOTE}
        </p>

        {error && <p className="form-alert" role="alert">{error}</p>}
        {saved && <p className="form-success" role="status">Đã lưu thay đổi.</p>}

        <button type="submit" className="btn btn--solid btn--lg form-submit" disabled={saving}>
          {saving ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </form>
    </section>
  );
}

function ReadOnlyField({
  id, label, value, mono = false, full = false,
}: {
  id: string; label: string; value: string; mono?: boolean; full?: boolean;
}) {
  return (
    <div className={`field${full ? " field--full" : ""}`}>
      <label htmlFor={id}>
        {label} <span className="lock-tag" title={ADMIN_ONLY_NOTE}>khoá</span>
      </label>
      <input
        id={id}
        value={value}
        readOnly
        disabled
        className={mono ? "mono" : undefined}
      />
      <span className="field__hint">{ADMIN_ONLY_NOTE}</span>
    </div>
  );
}

function PasswordCard() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setDone(false);

    const invalid = validateNewPassword(password, confirm);
    if (invalid) {
      setError(invalid);
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({ password });

      if (authError) {
        setError(
          authError.message.toLowerCase().includes("different from the old")
            ? "Mật khẩu mới phải khác mật khẩu hiện tại."
            : "Không đổi được mật khẩu. Vui lòng thử lại."
        );
        return;
      }

      setPassword("");
      setConfirm("");
      setDone(true);
    } catch {
      setError("Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="form-card profile-card">
      <h2 className="profile-card__title">Đổi mật khẩu</h2>

      <form onSubmit={handleSubmit} className="drawer__form" noValidate>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="p_pw">Mật khẩu mới</label>
            <input
              id="p_pw"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); setDone(false); }}
              placeholder="Ít nhất 8 ký tự, có chữ hoa và số"
            />
          </div>
          <div className="field">
            <label htmlFor="p_pw2">Nhập lại mật khẩu mới</label>
            <input
              id="p_pw2"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(null); setDone(false); }}
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && <p className="form-alert" role="alert">{error}</p>}
        {done && <p className="form-success" role="status">Đã đổi mật khẩu thành công.</p>}

        <button type="submit" className="btn btn--solid btn--lg form-submit" disabled={saving}>
          {saving ? "Đang lưu…" : "Đổi mật khẩu"}
        </button>
      </form>
    </section>
  );
}
