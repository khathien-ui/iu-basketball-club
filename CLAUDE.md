# CLAUDE.md

Website chính thức cho **CLB Bóng rổ IU (IU Basketball Club)** — Trường Đại học Quốc tế, ĐHQG TP.HCM. Design tham chiếu resend.com: tối giản, hiện đại, chuyên nghiệp.

**Trạng thái hiện tại**: đã migrate sang **Next.js 14 App Router + TypeScript** (`app/` + `components/`), giữ nguyên 100% design/nội dung từ prototype tĩnh. Chạy dev bằng `npm run dev` (port 3000). Chi tiết ở rule `tech-stack.md`.

Toàn bộ hướng dẫn chi tiết đã được tách thành rules theo chủ đề trong `.claude/rules/`:

| Rule | Chủ đề | Phạm vi load |
|---|---|---|
| `project-overview.md` | Tổng quan, nguồn thông tin CLB, việc chưa chốt | Luôn load |
| `workflow-mandatory.md` | Quy tắc bắt buộc: screenshot so sánh design, mobile-friendly, scroll animation | Luôn load |
| `tech-stack.md` | Next.js + TypeScript + Tailwind + Supabase; giai đoạn prototype hiện tại | Luôn load |
| `site-structure.md` | Cấu trúc trang & điều hướng | Luôn load |
| `design-system.md` | Màu sắc, typography, logo, component pattern | File UI (html/css/tsx/js) |
| `content-language.md` | Tiêu đề tiếng Anh, nội dung tiếng Việt có dấu | File nội dung (html/tsx/mdx) |
| `data-and-auth.md` | Vai trò, RLS, data model Supabase | app/, lib/, supabase/, *.sql |
| `code-conventions.md` | Quy ước code | File code |

Khi cập nhật quy ước, sửa đúng rule liên quan thay vì thêm vào file này.
