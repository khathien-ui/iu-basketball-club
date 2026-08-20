---
paths:
  - "**/*.{html,css}"
  - "app/**/*.{ts,tsx,js,jsx}"
  - "components/**/*.{ts,tsx,js,jsx}"
  - "js/**/*.js"
---

# Design system

Tham chiếu thẩm mỹ: **resend.com** — tối giản, hiện đại, "công nghệ", chuyên nghiệp. Nguyên tắc khi build UI:

- **Nền tối làm chủ đạo** — tone đã được nâng sáng nhẹ theo yêu cầu: nền `#121214`, card/raised `#19191c` (không dùng lại near-black `#0a0a0a` cũ), chữ trắng/xám nhạt, độ tương phản cao.
- **Một màu accent duy nhất** cho CTA/highlight: cam bóng rổ `#ff5c1a`. Không thêm màu thứ hai trừ khi thật cần (trạng thái lỗi/thành công).
- **Khoảng trắng rộng rãi**, bố cục theo lưới (grid), section rõ ràng, không nhồi nhét.
- **Viền mảnh 1px** (không đổ bóng nặng) để phân tách card/section.
- **Typography**: font sans-serif sạch (Inter/Geist), heading lớn dùng gradient trắng→cam nhạt (`#ffc4a3`); font mono cho số liệu/stat (điểm số, lịch thi đấu) để gợi cảm giác "kỹ thuật/dữ liệu".
- **Chuyển động tinh tế**: hover/transition mượt (nút hover nâng 2px + shadow nhẹ), không animation phô trương; tôn trọng `prefers-reduced-motion`.
- **Component pattern**: nav bar cố định mỏng, hero lớn với emblem logo tròn + gradient divider + 1 CTA chính, feature grid 3 cột, card có border mảnh + hover nhẹ.

## Logo

- File: `assets/logo.png` (artwork navy/đen trên nền trong suốt).
- Luôn đặt trên nền tròn trắng (artwork chìm trên nền tối nếu không có nền sáng), không viền xám quanh khung.
- Ảnh render ở 120% khung với `overflow: hidden` để họa tiết chiếm gần trọn khung (file gốc có nhiều margin trống).
- Kích thước hiện hành: hero emblem 168px, nav/footer badge 36px.
- Tên hiển thị cạnh logo: "IU Basketball Club".
