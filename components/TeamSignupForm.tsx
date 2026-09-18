"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { POSITION_LABEL, POSITION_ORDER } from "@/lib/recruits";
import {
  digitsOnly,
  emptyMember,
  findDuplicateStudentIds,
  MAX_MEMBERS,
  MIN_MEMBERS,
  normalizeStudentId,
  toRpcMembers,
  validateMember,
  type MemberDraft,
  type MemberErrors,
  type RegisterTeamResult,
} from "@/lib/teams";

export interface TournamentOption {
  id: string;
  title: string;
  event_date: string | null;
}

interface Props {
  tournaments: TournamentOption[];
}

interface CaptainDraft {
  name: string;
  student_id: string;
  email: string;
  phone: string;
}

type CaptainErrors = Partial<Record<keyof CaptainDraft, string>>;

const EMPTY_CAPTAIN: CaptainDraft = { name: "", student_id: "", email: "", phone: "" };

/** Đội hình khởi tạo: dòng đầu là đội trưởng, đủ MIN_MEMBERS dòng. */
function initialMembers(): MemberDraft[] {
  const rows = Array.from({ length: MIN_MEMBERS }, () => emptyMember());
  rows[0].is_captain = true;
  return rows;
}

export default function TeamSignupForm({ tournaments }: Props) {
  const [eventId, setEventId] = useState(tournaments[0]?.id ?? "");
  const [teamName, setTeamName] = useState("");
  const [captain, setCaptain] = useState<CaptainDraft>(EMPTY_CAPTAIN);
  const [members, setMembers] = useState<MemberDraft[]>(initialMembers);
  const [note, setNote] = useState("");

  const [teamNameError, setTeamNameError] = useState<string | null>(null);
  const [captainErrors, setCaptainErrors] = useState<CaptainErrors>({});
  const [memberErrors, setMemberErrors] = useState<MemberErrors[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RegisterTeamResult | null>(null);

  /*
   * Dòng đội trưởng trong đội hình luôn bám theo khối thông tin đội trưởng ở
   * trên, để không phải nhập hai lần và không bao giờ lệch nhau.
   */
  useEffect(() => {
    setMembers((rows) =>
      rows.map((r, i) =>
        i === 0
          ? { ...r, full_name: captain.name, student_id: captain.student_id, phone: captain.phone }
          : r
      )
    );
    // Ba ô này chỉ sửa được ở khối Đội trưởng, nên lỗi cũ của dòng 1 phải xoá
    // theo — không thì người dùng sửa ở trên mà lỗi vẫn treo ở dưới.
    setMemberErrors((errs) =>
      errs.map((e, i) =>
        i === 0 ? { ...e, full_name: undefined, student_id: undefined, phone: undefined } : e
      )
    );
  }, [captain.name, captain.student_id, captain.phone]);

  const duplicates = useMemo(() => findDuplicateStudentIds(members), [members]);

  function updateCaptain(key: keyof CaptainDraft, value: string) {
    setCaptain((c) => ({ ...c, [key]: value }));
    setCaptainErrors((e) => ({ ...e, [key]: undefined }));
    setSubmitError(null);
  }

  function updateMember(index: number, key: keyof MemberDraft, value: string) {
    setMembers((rows) => rows.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
    setMemberErrors((errs) =>
      errs.map((e, i) => (i === index ? { ...e, [key]: undefined } : e))
    );
    setSubmitError(null);
  }

  function addMember() {
    if (members.length >= MAX_MEMBERS) return;
    setMembers((rows) => [...rows, emptyMember()]);
    setSubmitError(null);
  }

  function removeMember(index: number) {
    // Dòng đội trưởng không bỏ được, và không xuống dưới mức tối thiểu.
    if (index === 0 || members.length <= MIN_MEMBERS) return;
    setMembers((rows) => rows.filter((_, i) => i !== index));
    setMemberErrors((errs) => errs.filter((_, i) => i !== index));
    setSubmitError(null);
  }

  function validateAll(): boolean {
    let ok = true;

    const name = teamName.trim();
    if (name.length < 2 || name.length > 60) {
      setTeamNameError("Tên đội phải dài từ 2 đến 60 ký tự.");
      ok = false;
    } else {
      setTeamNameError(null);
    }

    const capErrors: CaptainErrors = {};
    if (!captain.name.trim()) capErrors.name = "Nhập họ và tên đội trưởng.";
    if (!captain.student_id.trim()) capErrors.student_id = "Nhập MSSV đội trưởng.";
    if (!captain.email.trim()) {
      capErrors.email = "Nhập email liên hệ.";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(captain.email.trim())) {
      capErrors.email = "Email không đúng định dạng.";
    }
    if (digitsOnly(captain.phone).length !== 10) {
      capErrors.phone = "Số điện thoại phải có đúng 10 số.";
    }
    setCaptainErrors(capErrors);
    if (Object.keys(capErrors).length > 0) ok = false;

    const rowErrors = members.map((m) => validateMember(m));
    const dupes = findDuplicateStudentIds(members);
    members.forEach((m, i) => {
      const id = normalizeStudentId(m.student_id);
      if (id && dupes.has(id)) {
        rowErrors[i] = { ...rowErrors[i], student_id: "MSSV này bị nhập hai lần trong đội." };
      }
    });
    setMemberErrors(rowErrors);
    if (rowErrors.some((e) => Object.keys(e).length > 0)) ok = false;

    return ok;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError(null);

    if (!validateAll()) {
      const first = document.querySelector<HTMLElement>("[data-invalid='true']");
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      first?.focus({ preventScroll: true });
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("register_team", {
        p_event_id: eventId || null,
        p_team_name: teamName.trim(),
        p_captain_name: captain.name.trim(),
        p_captain_student_id: captain.student_id.trim(),
        p_captain_email: captain.email.trim(),
        p_captain_phone: digitsOnly(captain.phone),
        p_members: toRpcMembers(members),
        p_note: note.trim() || null,
      });

      if (error) {
        setSubmitError("Gửi đăng ký thất bại. Vui lòng thử lại sau ít phút.");
        return;
      }

      const res = data as RegisterTeamResult;
      if (!res?.success) {
        applyServerError(res);
        return;
      }

      setResult(res);
    } catch {
      setSubmitError("Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  /** Gắn lỗi từ database vào đúng ô nhập thay vì chỉ hiện một dòng chung. */
  function applyServerError(res: RegisterTeamResult) {
    const message = res?.message || "Không gửi được đăng ký. Vui lòng kiểm tra lại thông tin.";
    setSubmitError(message);

    if (res?.code === "team_name_taken") {
      setTeamNameError(message);
      return;
    }

    if ((res?.code === "duplicate_in_team" || res?.code === "duplicate_in_event") && res.student_id) {
      const target = normalizeStudentId(res.student_id);
      setMemberErrors((errs) => {
        const next = members.map((_, i) => ({ ...(errs[i] ?? {}) }));
        members.forEach((m, i) => {
          if (normalizeStudentId(m.student_id) === target) {
            next[i].student_id =
              res.code === "duplicate_in_team"
                ? "MSSV này bị nhập hai lần trong đội."
                : "MSSV này đã có tên trong một đội khác của giải.";
          }
        });
        return next;
      });
    }
  }

  // ---------- Màn hình xác nhận ----------
  if (result?.success) {
    return <TeamSubmitted result={result} />;
  }

  const canAdd = members.length < MAX_MEMBERS;
  const canRemove = members.length > MIN_MEMBERS;

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        {tournaments.length > 1 && (
          <div className="field field--full">
            <label htmlFor="event">Giải đấu <span className="req">*</span></label>
            <select id="event" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                  {t.event_date ? ` — ${t.event_date.split("-").reverse().join("/")}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field field--full">
          <label htmlFor="team_name">Tên đội <span className="req">*</span></label>
          <input
            id="team_name"
            type="text"
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              setTeamNameError(null);
              setSubmitError(null);
            }}
            placeholder="Ví dụ: Street Ballers"
            maxLength={60}
            data-invalid={teamNameError ? "true" : undefined}
            aria-invalid={!!teamNameError}
          />
          {teamNameError ? (
            <span className="field__error">{teamNameError}</span>
          ) : (
            <span className="field__hint">Tên đội phải khác với các đội đã đăng ký cùng giải.</span>
          )}
        </div>
      </div>

      {/* ---------- Đội trưởng ---------- */}
      <fieldset className="form-block">
        <legend>Đội trưởng</legend>
        <p className="field__hint form-block__hint">
          Ban điều hành sẽ liên hệ qua email và số điện thoại này. Đội trưởng được
          tính là một vận động viên trong đội hình bên dưới.
        </p>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="cap_name">Họ và tên <span className="req">*</span></label>
            <input
              id="cap_name"
              type="text"
              value={captain.name}
              onChange={(e) => updateCaptain("name", e.target.value)}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              data-invalid={captainErrors.name ? "true" : undefined}
              aria-invalid={!!captainErrors.name}
            />
            {captainErrors.name && <span className="field__error">{captainErrors.name}</span>}
          </div>

          <div className="field">
            <label htmlFor="cap_sid">MSSV <span className="req">*</span></label>
            <input
              id="cap_sid"
              type="text"
              value={captain.student_id}
              onChange={(e) => updateCaptain("student_id", e.target.value)}
              placeholder="ITITIU00000"
              data-invalid={captainErrors.student_id ? "true" : undefined}
              aria-invalid={!!captainErrors.student_id}
            />
            {captainErrors.student_id && (
              <span className="field__error">{captainErrors.student_id}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="cap_email">Email <span className="req">*</span></label>
            <input
              id="cap_email"
              type="email"
              inputMode="email"
              value={captain.email}
              onChange={(e) => updateCaptain("email", e.target.value)}
              placeholder="ban@example.com"
              autoComplete="email"
              data-invalid={captainErrors.email ? "true" : undefined}
              aria-invalid={!!captainErrors.email}
            />
            {captainErrors.email && <span className="field__error">{captainErrors.email}</span>}
          </div>

          <div className="field">
            <label htmlFor="cap_phone">Số điện thoại <span className="req">*</span></label>
            <input
              id="cap_phone"
              type="tel"
              inputMode="numeric"
              value={captain.phone}
              onChange={(e) => updateCaptain("phone", e.target.value)}
              placeholder="0901234567"
              autoComplete="tel"
              data-invalid={captainErrors.phone ? "true" : undefined}
              aria-invalid={!!captainErrors.phone}
            />
            {captainErrors.phone && <span className="field__error">{captainErrors.phone}</span>}
          </div>
        </div>
      </fieldset>

      {/* ---------- Đội hình ---------- */}
      <fieldset className="form-block">
        <legend>
          Đội hình <span className="mono roster-count">{members.length}/{MAX_MEMBERS}</span>
        </legend>
        <p className="field__hint form-block__hint">
          Mỗi đội cần {MIN_MEMBERS}–{MAX_MEMBERS} vận động viên, tính cả đội trưởng.
          Một người chỉ được thi đấu cho một đội trong cùng giải.
        </p>

        <div className="roster">
          {members.map((m, i) => {
            const errs = memberErrors[i] ?? {};
            const isCaptainRow = i === 0;
            const dup = !isCaptainRow && duplicates.has(normalizeStudentId(m.student_id));

            return (
              <div className="roster-row" key={i}>
                <div className="roster-row__head">
                  <span className="roster-row__index mono">
                    {isCaptainRow ? "Đội trưởng" : `Thành viên ${i + 1}`}
                  </span>
                  {!isCaptainRow && canRemove && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => removeMember(i)}
                    >
                      Bỏ dòng
                    </button>
                  )}
                </div>

                <div className="form-grid roster-row__grid">
                  <div className="field">
                    <label htmlFor={`m_name_${i}`}>Họ và tên <span className="req">*</span></label>
                    <input
                      id={`m_name_${i}`}
                      type="text"
                      value={m.full_name}
                      onChange={(e) => updateMember(i, "full_name", e.target.value)}
                      placeholder="Nguyễn Văn B"
                      readOnly={isCaptainRow}
                      data-invalid={errs.full_name ? "true" : undefined}
                      aria-invalid={!!errs.full_name}
                    />
                    {errs.full_name && <span className="field__error">{errs.full_name}</span>}
                  </div>

                  <div className="field">
                    <label htmlFor={`m_sid_${i}`}>MSSV <span className="req">*</span></label>
                    <input
                      id={`m_sid_${i}`}
                      type="text"
                      value={m.student_id}
                      onChange={(e) => updateMember(i, "student_id", e.target.value)}
                      placeholder="ITITIU00000"
                      readOnly={isCaptainRow}
                      data-invalid={errs.student_id || dup ? "true" : undefined}
                      aria-invalid={!!errs.student_id || dup}
                    />
                    {errs.student_id ? (
                      <span className="field__error">{errs.student_id}</span>
                    ) : dup ? (
                      <span className="field__error">MSSV này bị nhập hai lần trong đội.</span>
                    ) : null}
                  </div>

                  <div className="field">
                    <label htmlFor={`m_phone_${i}`}>
                      Số điện thoại <span className="opt">(không bắt buộc)</span>
                    </label>
                    <input
                      id={`m_phone_${i}`}
                      type="tel"
                      inputMode="numeric"
                      value={m.phone}
                      onChange={(e) => updateMember(i, "phone", e.target.value)}
                      placeholder="0901234567"
                      readOnly={isCaptainRow}
                      data-invalid={errs.phone ? "true" : undefined}
                      aria-invalid={!!errs.phone}
                    />
                    {errs.phone && <span className="field__error">{errs.phone}</span>}
                  </div>

                  <div className="field">
                    <label htmlFor={`m_height_${i}`}>
                      Chiều cao (cm) <span className="opt">(không bắt buộc)</span>
                    </label>
                    <input
                      id={`m_height_${i}`}
                      type="number"
                      inputMode="numeric"
                      min={100}
                      max={250}
                      value={m.height_cm}
                      onChange={(e) => updateMember(i, "height_cm", e.target.value)}
                      placeholder="175"
                      data-invalid={errs.height_cm ? "true" : undefined}
                      aria-invalid={!!errs.height_cm}
                    />
                    {errs.height_cm && <span className="field__error">{errs.height_cm}</span>}
                  </div>

                  <div className="field field--full">
                    <label htmlFor={`m_pos_${i}`}>
                      Vị trí <span className="opt">(không bắt buộc)</span>
                    </label>
                    <select
                      id={`m_pos_${i}`}
                      value={m.position}
                      onChange={(e) => updateMember(i, "position", e.target.value)}
                    >
                      <option value="">— Chưa biết —</option>
                      {POSITION_ORDER.filter((p) => p !== "unknown").map((p) => (
                        <option key={p} value={p}>{POSITION_LABEL[p]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {isCaptainRow && (
                  <p className="field__hint roster-row__note">
                    Họ tên, MSSV và số điện thoại lấy từ phần Đội trưởng ở trên.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="roster-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={addMember}
            disabled={!canAdd}
          >
            + Thêm thành viên
          </button>
          {!canAdd && (
            <span className="field__hint">Đã đủ {MAX_MEMBERS} người — mức tối đa của một đội.</span>
          )}
        </div>
      </fieldset>

      <div className="field field--full">
        <label htmlFor="note">Ghi chú <span className="opt">(không bắt buộc)</span></label>
        <textarea
          id="note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Điều bạn muốn ban tổ chức biết thêm: lịch bận, yêu cầu riêng…"
        />
      </div>

      {submitError && <p className="form-alert" role="alert">{submitError}</p>}

      <button type="submit" className="btn btn--solid btn--lg form-submit" disabled={submitting}>
        {submitting ? "Đang gửi đăng ký…" : "Gửi đăng ký đội"}
      </button>

      <p className="form-note">
        Các trường có dấu <span className="req">*</span> là bắt buộc. Thông tin của đội
        chỉ được ban tổ chức sử dụng cho mục đích tổ chức giải.
      </p>
    </form>
  );
}

function TeamSubmitted({ result }: { result: RegisterTeamResult }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!result.team_code) return;
    try {
      await navigator.clipboard.writeText(result.team_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="form-card form-done">
      <div className="form-done__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="m8 12.5 2.5 2.5L16 9.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2>Đã nhận đăng ký của đội {result.team_name}!</h2>
      <p>
        Đăng ký đang ở trạng thái <strong>chờ duyệt</strong>. Ban tổ chức sẽ xét duyệt
        và liên hệ đội trưởng qua email hoặc số điện thoại bạn để lại.
      </p>

      <div className="team-code">
        <span className="team-code__label">Mã đội của bạn</span>
        <strong className="team-code__value mono">{result.team_code}</strong>
        <button type="button" className="btn btn--ghost btn--sm" onClick={copyCode}>
          {copied ? "Đã copy!" : "Copy mã"}
        </button>
      </div>

      <p className="form-done__hint">
        Hãy lưu lại mã này — ban tổ chức dùng mã để tra cứu đội của bạn khi cần đối
        chiếu thông tin hoặc xếp lịch thi đấu.
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
