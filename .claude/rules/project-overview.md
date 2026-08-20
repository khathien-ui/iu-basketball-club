# Tổng quan dự án

Website chính thức cho **Câu lạc bộ Bóng rổ — Trường Đại học Quốc tế (IU), Đại học Quốc gia TP.HCM** (IU Basketball Club).

Ba trụ cột chức năng:
1. **Cổng thông tin (Portal)** — giới thiệu CLB, ban điều hành, tin tức, trang chủ công khai.
2. **Quản lý thành viên** — đăng ký/đăng nhập, hồ sơ thành viên, phân quyền, trạng thái hội viên.
3. **Sự kiện & truyền thông** — tổ chức giải đấu, đăng ký tuyển quân (tryout), thư viện ảnh/video, thông báo.

Đối tượng dùng: sinh viên IU/VNU (thành viên & không thành viên), ban điều hành CLB, khách truy cập ngoài trường (đối thủ, nhà tài trợ).

## Nguồn thông tin CLB

Facebook page chính thức: https://www.facebook.com/IUBASKETBALLL (tên trang: "IU Basketball Club", địa điểm: Ho Chi Minh City).

Facebook chặn truy xuất nội dung khi không đăng nhập, nên **không thể tự động lấy** About text, thành tích, thông tin liên hệ, lịch sử thành lập, hay bài đăng/ảnh gần đây từ trang này. Khi build các trang About Us / Executive Board / Gallery / News, cần người phụ trách CLB cung cấp trực tiếp (copy text, export ảnh, hoặc paste screenshot) thay vì giả định Claude có thể tự crawl được.

## Việc chưa chốt (hỏi người dùng khi cần)

- Màu accent chính thức của CLB (mã màu cụ thể).
- Có cho phép người ngoài IU/VNU đăng ký tuyển quân/giải đấu không.
- Domain và phương án deploy cuối cùng nếu không dùng Vercel.
- Nội dung thực từ Facebook page (About text, thành tích, ban điều hành, ảnh gallery, liên hệ) — cần người phụ trách CLB cung cấp thủ công.
