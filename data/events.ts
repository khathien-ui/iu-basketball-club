export type EventTag = "TRYOUTS" | "MATCH" | "TOURNAMENT";

const FANPAGE = "https://www.facebook.com/IUBASKETBALLL";

export interface ClubEvent {
  name: string;
  desc: string;
  tag: EventTag;
  action: string;
  href: string;
  /** true = link ra ngoài, mở tab mới */
  external?: boolean;
  /** ghi chú nhỏ hiện dưới nút */
  note?: string;
  date: string;
}

/** Danh sách sự kiện đầy đủ — section Upcoming Events */
export const events: ClubEvent[] = [
  {
    name: "Fall Tryouts",
    desc: "Mở đăng ký cho toàn bộ sinh viên IU — không cần kinh nghiệm vẫn có thể thử sức.",
    tag: "TRYOUTS",
    action: "Register",
    href: "/tryout",
    date: "TBA",
  },
  {
    name: "Season Opener",
    desc: "Trận mở màn mùa giải — địa điểm và đối thủ sẽ được công bố sau.",
    tag: "MATCH",
    action: "Details",
    href: FANPAGE,
    external: true,
    date: "TBA",
  },
  {
    name: "IU 3x3 Tournament",
    desc: "Giải 3x3 toàn trường, mở đăng ký cho các đội sinh viên.",
    tag: "TOURNAMENT",
    action: "Register a Team",
    href: FANPAGE,
    external: true,
    note: "Đăng ký đội — sắp mở",
    date: "TBA",
  },
];

export interface HeroEventItem {
  date: string;
  label: string;
  tag: EventTag;
}

/** Các item hiển thị trong panel upcoming_events.log ở hero */
export const heroEvents: HeroEventItem[] = [
  { date: "TBA", label: "Tuyển quân mùa Thu — Mở đăng ký", tag: "TRYOUTS" },
  { date: "TBA", label: "Trận mở màn mùa giải vs. TBD", tag: "MATCH" },
  { date: "TBA", label: "Giải đấu 3x3 IU", tag: "TOURNAMENT" },
];
