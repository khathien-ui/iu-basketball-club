const FANPAGE = "https://www.facebook.com/IUBASKETBALLL";

interface Props {
  title: string;
  /** Mặc định mời theo dõi fanpage — nơi CLB cập nhật sớm nhất. */
  message?: string;
  showFanpage?: boolean;
}

/** Trạng thái rỗng nhẹ nhàng, dùng chung cho các section công khai. */
export default function EmptyState({
  title,
  message = "Theo dõi fanpage của CLB để cập nhật sớm nhất.",
  showFanpage = true,
}: Props) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__message">{message}</p>
      {showFanpage && (
        <a href={FANPAGE} target="_blank" rel="noopener" className="btn btn--ghost">
          Theo dõi fanpage CLB
        </a>
      )}
    </div>
  );
}
