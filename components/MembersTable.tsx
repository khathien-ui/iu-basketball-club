"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AvatarUpload from "./AvatarUpload";
import MemberFormDialog, { type MemberDraft } from "./MemberFormDialog";
import {
  initialsOf,
  ROLE_LABEL,
  ROLE_ORDER,
  type Profile,
  type UserRole,
} from "@/lib/members";
import { POSITION_LABEL, POSITION_ORDER, POSITION_SHORT, type RecruitPosition } from "@/lib/recruits";

interface Props {
  initialMembers: Profile[];
  currentUserId: string;
}

export default function MembersTable({ initialMembers, currentUserId }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "locked">("all");
  const [detail, setDetail] = useState<Profile | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!detail) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setDetail(null); };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [detail]);

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter((m) => m.is_active).length,
    pendingPassword: members.filter((m) => m.must_change_password).length,
  }), [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => roleFilter === "all" || m.role === roleFilter)
      .filter((m) =>
        activeFilter === "all" ||
        (activeFilter === "active" ? m.is_active : !m.is_active)
      )
      .filter((m) =>
        !q ||
        (m.full_name ?? "").toLowerCase().includes(q) ||
        (m.student_id ?? "").toLowerCase().includes(q) ||
        (m.email ?? "").toLowerCase().includes(q)
      );
  }, [members, roleFilter, activeFilter, query]);

  function patchMember(id: string, patch: Partial<Profile>) {
    setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    setDetail((d) => (d && d.id === id ? { ...d, ...patch } : d));
  }

  async function saveMember(member: Profile, patch: Partial<Profile>) {
    setAlert(null);
    setBusyId(member.id);
    const previous = members;
    patchMember(member.id, patch);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").update(patch).eq("id", member.id);

      if (error) {
        setMembers(previous);
        setDetail((d) => (d && d.id === member.id ? member : d));
        // 42501 = trigger bảo vệ admin cuối / tự khoá mình, hoặc RLS chặn
        setAlert({
          kind: "error",
          text: error.code === "42501"
            ? error.message || "Thao tác không được phép."
            : "Không lưu được thay đổi. Vui lòng thử lại.",
        });
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setMembers(previous);
      setAlert({ kind: "error", text: "Không kết nối được máy chủ." });
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function toggleLock(member: Profile) {
    if (member.id === currentUserId && member.is_active) {
      setAlert({ kind: "error", text: "Bạn không thể tự khoá tài khoản của chính mình." });
      return;
    }
    const ok = await saveMember(member, { is_active: !member.is_active });
    if (ok) {
      setAlert({
        kind: "success",
        text: member.is_active ? "Đã khoá tài khoản." : "Đã mở khoá tài khoản.",
      });
    }
  }

  async function resendInvite(member: Profile) {
    setAlert(null);
    setBusyId(member.id);
    try {
      const res = await fetch("/api/members/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAlert({ kind: "error", text: data.error ?? "Không gửi lại được lời mời." });
        return;
      }

      if (data.email_sent) {
        setAlert({ kind: "success", text: `Đã gửi lại email cho ${data.email}.` });
      } else {
        setCredentials({
          email: data.email,
          password: data.temp_password,
          emailFailed: true,
        });
      }
    } catch {
      setAlert({ kind: "error", text: "Không kết nối được máy chủ." });
    } finally {
      setBusyId(null);
    }
  }

  const [credentials, setCredentials] = useState<{
    email: string; password: string; emailFailed: boolean;
  } | null>(null);

  function handleCreated(result: {
    email: string; temp_password: string; email_sent: boolean;
  }) {
    setAdding(false);
    router.refresh();
    if (result.email_sent) {
      setAlert({ kind: "success", text: `Đã tạo tài khoản và gửi email tới ${result.email}.` });
    } else {
      setCredentials({
        email: result.email,
        password: result.temp_password,
        emailFailed: true,
      });
    }
  }

  return (
    <div className="recruits">
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.total}</span>
          <span className="stat-card__label">Tổng thành viên</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.active}</span>
          <span className="stat-card__label">Đang hoạt động</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.pendingPassword}</span>
          <span className="stat-card__label">Chưa đổi mật khẩu</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar__search field">
          <label htmlFor="mSearch" className="sr-only">Tìm theo tên, MSSV hoặc email</label>
          <input
            id="mSearch"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, MSSV hoặc email…"
          />
        </div>

        <div className="field">
          <label htmlFor="mRole" className="sr-only">Lọc theo vai trò</label>
          <select id="mRole" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}>
            <option value="all">Tất cả vai trò</option>
            {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor="mActive" className="sr-only">Lọc theo trạng thái</label>
          <select id="mActive" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khoá</option>
          </select>
        </div>

        <button type="button" className="btn btn--solid" onClick={() => setAdding(true)}>
          Thêm thành viên
        </button>
      </div>

      {alert && (
        <p className={alert.kind === "error" ? "form-alert" : "form-success"} role="alert">
          {alert.text}
        </p>
      )}

      {credentials && (
        <CredentialsPanel
          {...credentials}
          onClose={() => setCredentials(null)}
        />
      )}

      <p className="recruits__count">Hiển thị {filtered.length} / {members.length} thành viên</p>

      {filtered.length === 0 ? (
        <div className="form-card recruits__empty">
          <p>{members.length === 0 ? "Chưa có thành viên nào." : "Không có thành viên khớp bộ lọc."}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>MSSV</th>
                <th>Vị trí</th>
                <th>Cao</th>
                <th>Năm vào</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setDetail(m)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") setDetail(m); }}
                  className={busyId === m.id ? "is-saving" : undefined}
                >
                  <td data-label="Thành viên">
                    <span className="member-cell">
                      <span className="avatar">
                        {m.avatar_url
                          ? <img src={m.avatar_url} alt="" />
                          : <span>{initialsOf(m.full_name, m.email)}</span>}
                      </span>
                      <span className="member-cell__text">
                        <strong>{m.full_name || "(chưa đặt tên)"}</strong>
                        <em>{m.email}</em>
                      </span>
                    </span>
                  </td>
                  <td data-label="MSSV" className="mono">{m.student_id || "—"}</td>
                  <td data-label="Vị trí"><span className="pos-chip">{POSITION_SHORT[m.position]}</span></td>
                  <td data-label="Chiều cao" className="mono">{m.height_cm ?? "—"}</td>
                  <td data-label="Năm vào" className="mono">{m.joined_year ?? "—"}</td>
                  <td data-label="Vai trò">
                    <span className={`role-chip role-chip--${m.role}`}>{ROLE_LABEL[m.role]}</span>
                  </td>
                  <td data-label="Trạng thái">
                    <span className={`state-badge state-badge--${m.is_active ? "open" : "closed"}`}>
                      {m.is_active ? "Hoạt động" : "Đã khoá"}
                    </span>
                    {m.must_change_password && (
                      <span className="pw-flag" title="Chưa đổi mật khẩu tạm">MK tạm</span>
                    )}
                  </td>
                  <td data-label="" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDetail(m)}>
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <MemberFormDialog
          title="Thêm thành viên"
          onClose={() => setAdding(false)}
          onCreated={handleCreated}
        />
      )}

      {detail && (
        <MemberDrawer
          member={detail}
          isSelf={detail.id === currentUserId}
          busy={busyId === detail.id}
          onClose={() => setDetail(null)}
          onSave={(patch) => saveMember(detail, patch)}
          onToggleLock={() => toggleLock(detail)}
          onResend={() => resendInvite(detail)}
          onAvatar={(url) => saveMember(detail, { avatar_url: url })}
        />
      )}
    </div>
  );
}

function CredentialsPanel({
  email, password, emailFailed, onClose,
}: { email: string; password: string; emailFailed: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = `Email: ${email}\nMật khẩu tạm: ${password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="creds">
      <div className="creds__head">
        <strong>
          {emailFailed
            ? "Đã tạo tài khoản nhưng gửi email thất bại"
            : "Thông tin đăng nhập"}
        </strong>
        <button type="button" className="drawer__close" aria-label="Đóng" onClick={onClose}>×</button>
      </div>
      <p className="creds__note">
        Vui lòng gửi thủ công thông tin bên dưới cho thành viên. Mật khẩu tạm chỉ hiện một lần.
      </p>
      <div className="creds__row"><span>Email</span><code>{email}</code></div>
      <div className="creds__row"><span>Mật khẩu tạm</span><code>{password}</code></div>
      <button type="button" className="btn btn--solid" onClick={copy}>
        {copied ? "Đã copy!" : "Copy thông tin"}
      </button>
    </div>
  );
}

function MemberDrawer({
  member, isSelf, busy, onClose, onSave, onToggleLock, onResend, onAvatar,
}: {
  member: Profile;
  isSelf: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (patch: Partial<Profile>) => Promise<boolean>;
  onToggleLock: () => void;
  onResend: () => void;
  onAvatar: (url: string) => void;
}) {
  const [form, setForm] = useState({
    full_name: member.full_name ?? "",
    student_id: member.student_id ?? "",
    phone: member.phone ?? "",
    position: member.position,
    height_cm: member.height_cm?.toString() ?? "",
    joined_year: member.joined_year?.toString() ?? "",
    role: member.role,
  });
  const [saved, setSaved] = useState(false);

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    setSaved(false);
    const ok = await onSave({
      full_name: form.full_name.trim() || null,
      student_id: form.student_id.trim() || null,
      phone: form.phone.trim() || null,
      position: form.position as RecruitPosition,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      joined_year: form.joined_year ? Number(form.joined_year) : null,
      role: form.role as UserRole,
    });
    if (ok) setSaved(true);
  }

  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-label="Hồ sơ thành viên" onClick={onClose}>
      <aside className="drawer__panel" onClick={(e) => e.stopPropagation()}>
        <header className="drawer__head">
          <div>
            <h2>{member.full_name || "(chưa đặt tên)"}</h2>
            <p className="mono">{member.email}</p>
          </div>
          <button type="button" className="drawer__close" aria-label="Đóng" onClick={onClose}>×</button>
        </header>

        <AvatarUpload
          userId={member.id}
          currentUrl={member.avatar_url}
          fallback={initialsOf(member.full_name, member.email)}
          onUploaded={onAvatar}
        />

        <form onSubmit={handleSave} className="drawer__form">
          <div className="form-grid">
            <div className="field field--full">
              <label htmlFor="d_name">Họ và tên</label>
              <input id="d_name" value={form.full_name}
                onChange={(e) => { setForm(f => ({ ...f, full_name: e.target.value })); setSaved(false); }} />
            </div>
            <div className="field">
              <label htmlFor="d_sid">MSSV</label>
              <input id="d_sid" value={form.student_id}
                onChange={(e) => { setForm(f => ({ ...f, student_id: e.target.value })); setSaved(false); }} />
            </div>
            <div className="field">
              <label htmlFor="d_phone">Số điện thoại</label>
              <input id="d_phone" value={form.phone}
                onChange={(e) => { setForm(f => ({ ...f, phone: e.target.value })); setSaved(false); }} />
            </div>
            <div className="field">
              <label htmlFor="d_pos">Vị trí</label>
              <select id="d_pos" value={form.position}
                onChange={(e) => { setForm(f => ({ ...f, position: e.target.value as RecruitPosition })); setSaved(false); }}>
                {POSITION_ORDER.map(p => <option key={p} value={p}>{POSITION_LABEL[p]}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="d_height">Chiều cao (cm)</label>
              <input id="d_height" type="number" min={100} max={250} value={form.height_cm}
                onChange={(e) => { setForm(f => ({ ...f, height_cm: e.target.value })); setSaved(false); }} />
            </div>
            <div className="field">
              <label htmlFor="d_year">Năm vào CLB</label>
              <input id="d_year" type="number" min={2000} max={2100} value={form.joined_year}
                onChange={(e) => { setForm(f => ({ ...f, joined_year: e.target.value })); setSaved(false); }} />
            </div>
            <div className="field">
              <label htmlFor="d_role">Vai trò</label>
              <select id="d_role" value={form.role}
                onChange={(e) => { setForm(f => ({ ...f, role: e.target.value as UserRole })); setSaved(false); }}>
                {ROLE_ORDER.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
          </div>

          {saved && <p className="form-success" role="status">Đã lưu thay đổi.</p>}

          <button type="submit" className="btn btn--solid btn--lg form-submit" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </form>

        <div className="drawer__danger">
          {member.must_change_password && (
            <button type="button" className="btn btn--ghost" onClick={onResend} disabled={busy}>
              Gửi lại email mời
            </button>
          )}
          <button
            type="button"
            className={`btn ${member.is_active ? "btn--danger" : "btn--ghost"}`}
            onClick={onToggleLock}
            disabled={busy || (isSelf && member.is_active)}
            title={isSelf && member.is_active ? "Không thể tự khoá chính mình" : undefined}
          >
            {member.is_active ? "Khoá tài khoản" : "Mở khoá tài khoản"}
          </button>
        </div>
      </aside>
    </div>
  );
}
