---
paths:
  - "app/**/*"
  - "lib/**/*"
  - "supabase/**/*"
  - "**/*.sql"
---

# Vai trò, phân quyền & data model (Supabase)

## Vai trò

- `admin` — toàn quyền quản trị nội dung, thành viên, sự kiện.
- `executive_board` — quản lý sự kiện, tin tức, gallery; không quản lý được vai trò người khác.
- `member` — xem nội dung members-only, đăng ký sự kiện, cập nhật hồ sơ bản thân.
- `guest` (chưa đăng nhập) — chỉ xem nội dung công khai, có thể nộp đơn đăng ký tuyển quân/giải đấu qua form public nếu CLB cho phép người ngoài CLB tham gia.

Dùng Supabase Row Level Security (RLS) cho **mọi** bảng — không kiểm tra quyền chỉ ở phía client.

## Phác thảo data model (Postgres)

- `profiles` — liên kết `auth.users`, họ tên, MSSV, khoa, vai trò, avatar, trạng thái hội viên.
- `executive_board` — vị trí trong ban điều hành, nhiệm kỳ, liên kết `profiles`.
- `events` — tên, loại (giải đấu/tuyển quân/khác), mô tả song ngữ, thời gian, địa điểm, trạng thái mở đăng ký.
- `event_registrations` — liên kết `events` + `profiles` (hoặc thông tin khách nếu cho phép người ngoài đăng ký), trạng thái duyệt.
- `news_posts` — tiêu đề, nội dung song ngữ, ảnh cover, ngày đăng, tác giả.
- `gallery_media` — ảnh/video, liên kết sự kiện (tùy chọn), caption.

Điều chỉnh schema thực tế khi bắt đầu code — đây là khung tham khảo, không phải migration cuối cùng.
