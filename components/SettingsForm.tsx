"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  formatDateTime,
  isoToLocalInput,
  isWindowOpen,
  localInputToIso,
  WINDOW_LABEL,
  type RegistrationWindow,
} from "@/lib/registrationWindows";

interface Props {
  initialWindows: RegistrationWindow[];
}

export default function SettingsForm({ initialWindows }: Props) {
  const [windows, setWindows] = useState(initialWindows);

  return (
    <div className="settings">
      {windows.length === 0 && (
        <p className="form-alert" role="alert">
          Chưa có cấu hình đợt nào. Hãy chạy migration <code>003_registration_windows.sql</code> trong Supabase.
        </p>
      )}
      {windows.map((w) => (
        <WindowCard
          key={w.id}
          window={w}
          onSaved={(updated) =>
            setWindows((ws) => ws.map((x) => (x.id === updated.id ? updated : x)))
          }
        />
      ))}
    </div>
  );
}

function WindowCard({
  window: initial,
  onSaved,
}: {
  window: RegistrationWindow;
  onSaved: (w: RegistrationWindow) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    is_open: initial.is_open,
    title: initial.title ?? "",
    opens_at: isoToLocalInput(initial.opens_at),
    closes_at: isoToLocalInput(initial.closes_at),
    closed_message: initial.closed_message ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const effective: RegistrationWindow = {
    ...initial,
    is_open: form.is_open,
    opens_at: localInputToIso(form.opens_at),
    closes_at: localInputToIso(form.closes_at),
  };
  const open = isWindowOpen(effective);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
    setSaved(false);
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    const opensIso = localInputToIso(form.opens_at);
    const closesIso = localInputToIso(form.closes_at);

    if (opensIso && closesIso && new Date(closesIso) <= new Date(opensIso)) {
      setError("Ngày đóng phải sau ngày mở.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        is_open: form.is_open,
        title: form.title.trim() || null,
        opens_at: opensIso,
        closes_at: closesIso,
        closed_message: form.closed_message.trim() || null,
      };

      const { error: dbError } = await supabase
        .from("registration_windows")
        .update(payload)
        .eq("id", initial.id);

      if (dbError) {
        setError(
          dbError.code === "42501"
            ? "Bạn không có quyền thay đổi cấu hình này."
            : "Không lưu được thay đổi. Vui lòng thử lại."
        );
        return;
      }

      onSaved({ ...initial, ...payload });
      setSaved(true);
      router.refresh();
    } catch {
      setError("Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-card settings-card" onSubmit={handleSave}>
      <header className="settings-card__head">
        <div>
          <h2>{WINDOW_LABEL[initial.type]}</h2>
          <p className="mono settings-card__type">type = {initial.type}</p>
        </div>
        <span className={`state-badge state-badge--${open ? "open" : "closed"}`}>
          {open ? "Đang mở" : "Đang đóng"}
        </span>
      </header>

      <label className="switch">
        <input
          type="checkbox"
          checked={form.is_open}
          onChange={(e) => update("is_open", e.target.checked)}
        />
        <span>Bật đợt đăng ký</span>
      </label>

      {form.is_open && !open && (
        <p className="settings-card__hint">
          Đã bật nhưng đang đóng do lịch: kiểm tra lại ngày mở / ngày đóng bên dưới.
        </p>
      )}

      <div className="form-grid">
        <div className="field field--full">
          <label htmlFor={`title-${initial.id}`}>Tên đợt</label>
          <input
            id={`title-${initial.id}`}
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="VD: Tuyển quân mùa Thu 2026"
          />
        </div>

        <div className="field">
          <label htmlFor={`opens-${initial.id}`}>Ngày mở</label>
          <input
            id={`opens-${initial.id}`}
            type="datetime-local"
            value={form.opens_at}
            onChange={(e) => update("opens_at", e.target.value)}
          />
          <span className="field__hint">Để trống = mở ngay khi bật.</span>
        </div>

        <div className="field">
          <label htmlFor={`closes-${initial.id}`}>Ngày đóng</label>
          <input
            id={`closes-${initial.id}`}
            type="datetime-local"
            value={form.closes_at}
            onChange={(e) => update("closes_at", e.target.value)}
          />
          <span className="field__hint">Quá hạn sẽ tự đóng dù đang bật.</span>
        </div>

        <div className="field field--full">
          <label htmlFor={`msg-${initial.id}`}>Nội dung hiện khi đóng</label>
          <textarea
            id={`msg-${initial.id}`}
            rows={3}
            value={form.closed_message}
            onChange={(e) => update("closed_message", e.target.value)}
            placeholder="VD: Đợt tuyển quân hiện chưa mở. Theo dõi fanpage để nhận thông báo…"
          />
        </div>
      </div>

      {initial.opens_at && (
        <p className="settings-card__hint">
          Đang lưu — mở: {formatDateTime(initial.opens_at)}
          {initial.closes_at && ` · đóng: ${formatDateTime(initial.closes_at)}`}
        </p>
      )}

      {error && <p className="form-alert" role="alert">{error}</p>}
      {saved && <p className="form-success" role="status">Đã lưu thay đổi.</p>}

      <button type="submit" className="btn btn--solid btn--lg form-submit" disabled={saving}>
        {saving ? "Đang lưu…" : "Lưu thay đổi"}
      </button>
    </form>
  );
}
