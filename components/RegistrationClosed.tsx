import {
  CLOSED_TITLE,
  DEFAULT_CLOSED_MESSAGE,
  formatDateTime,
  opensInFuture,
  type RegistrationType,
  type RegistrationWindow,
} from "@/lib/registrationWindows";

const FANPAGE = "https://www.facebook.com/IUBASKETBALLL";

interface Props {
  type: RegistrationType;
  window: RegistrationWindow | null;
}

export default function RegistrationClosed({ type, window }: Props) {
  const message = window?.closed_message?.trim() || DEFAULT_CLOSED_MESSAGE;
  const showOpensAt = opensInFuture(window);

  return (
    <div className="form-card form-done closed-card">
      <div className="closed-card__logo">
        <img src="/assets/logo.png" alt="IU Basketball Club" />
      </div>

      <h2>{CLOSED_TITLE[type]}</h2>

      {window?.title && <p className="closed-card__batch mono">{window.title}</p>}

      <p>{message}</p>

      {showOpensAt && window?.opens_at && (
        <p className="closed-card__opens">
          Dự kiến mở: <strong>{formatDateTime(window.opens_at)}</strong>
        </p>
      )}

      <div className="form-done__actions">
        <a href={FANPAGE} target="_blank" rel="noopener" className="btn btn--solid btn--lg">
          Theo dõi fanpage CLB
        </a>
        <a href="/" className="btn btn--ghost btn--lg">Về trang chủ</a>
      </div>
    </div>
  );
}
