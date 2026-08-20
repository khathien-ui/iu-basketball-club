# Quy tắc bắt buộc

Áp dụng cho mọi thay đổi trong dự án này, không ngoại lệ:

1. **Screenshot so sánh design** — sau mỗi thay đổi giao diện đáng kể (thêm/sửa 1 section, trang mới, đổi layout), chụp screenshot trang đã build và so sánh với ảnh design gốc (`resend.com_.png`) để kiểm tra có bám sát định hướng thẩm mỹ (nền tối, 1 accent color, viền mảnh, whitespace rộng — xem rule design-system) hay không. Nêu rõ chỗ lệch nếu có trước khi coi là hoàn thành.
2. **Mobile-friendly bắt buộc** — mọi trang/section phải test responsive ở tối thiểu 3 breakpoint: mobile (~375px), tablet (~768px), desktop (~1280px+) trước khi báo hoàn thành. Không merge/complete một tính năng UI chỉ test trên desktop.
3. **Scroll animation cho mọi section** — mỗi section nội dung (theo chiều dọc trang) phải có animation khi cuộn vào viewport (fade-in/slide-up nhẹ, đúng tinh thần "chuyển động tinh tế" của design system, không phô trương). Dùng Framer Motion hoặc IntersectionObserver thuần; tránh animation nặng làm giảm performance/Lighthouse score.

## Ghi chú kỹ thuật screenshot (đã kiểm chứng trong dự án)

- Prototype tĩnh có chế độ `?noanim` để chụp headless không bị section ẩn do scroll animation.
- Headless Chrome CLI trên Windows có min window width ~500px làm sai layout mobile — dùng puppeteer-core với `page.setViewport()` để emulate viewport chính xác.
