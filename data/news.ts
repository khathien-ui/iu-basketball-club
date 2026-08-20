export interface NewsPost {
  title: string;
  desc: string;
  date: string;
}

/** Tin tức — section News */
export const news: NewsPost[] = [
  {
    title: "Sắp mở đăng ký tuyển quân",
    desc: "Chi tiết cách đăng ký cho mùa giải sắp tới sẽ được cập nhật tại đây.",
    date: "TBA",
  },
  {
    title: "Công bố ban điều hành mới",
    desc: "Gặp gỡ những sinh viên dẫn dắt CLB trong năm nay.",
    date: "TBA",
  },
  {
    title: "Lịch giải đấu đang được hoàn thiện",
    desc: "Theo dõi trang Facebook của CLB để nhận thông tin mới nhất.",
    date: "TBA",
  },
];
