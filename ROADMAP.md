# ROADMAP — IU Basketball Club Website

## Giai đoạn 1 — Prototype design ✅ (08/2026)

- Prototype tĩnh HTML/CSS/JS theo design tham chiếu resend.com.
- Chốt design system: nền tối, accent cam `#ff5c1a`, logo emblem, scroll animation.

## Giai đoạn 2 — Migrate Next.js ✅ (08/2026)

- Next.js 14 App Router + TypeScript, tách 11 component, `lang="vi"`.
- Push GitHub (`khathien-ui/iu-basketball-club`).

## Giai đoạn 3 — Data layer ✅ (08/2026)

- Tách nội dung động ra `data/*.ts` (events, board, news, testimonials).
- Chuẩn bị điểm nối để thay bằng Supabase query sau này.

### ⚠️ BẢO MẬT BẮT BUỘC — chưa hoàn thành, KHÔNG ĐƯỢC BỎ QUA

**Siết policy SELECT của bảng `recruits`.** Migration `001_recruits.sql` hiện cho **mọi authenticated user** đọc toàn bộ đơn đăng ký tuyển quân — dữ liệu này chứa email, số điện thoại và MSSV của sinh viên, nên bất kỳ thành viên thường nào đăng nhập cũng xem được toàn bộ thông tin cá nhân người khác.

Phải đổi thành **chỉ role `admin` / `executive_board`** mới đọc được. Viết **migration `002`** ngay sau khi tạo bảng `profiles` (Giai đoạn 4) — không để trạng thái hiện tại tồn tại sau khi hệ thống có người dùng thật.

## Giai đoạn 4 — Supabase & thành viên

- Kết nối Supabase (Postgres + Auth + Storage), RLS cho mọi bảng.
- Đăng ký/đăng nhập, hồ sơ thành viên, phân quyền (admin / executive_board / member / guest).
- Bật lại nút Member Login. Trang Members (public một phần, đầy đủ khi đăng nhập).
- ⚠️ Ngay sau khi có bảng `profiles`: viết migration `002` siết policy SELECT của `recruits` (xem mục bảo mật bắt buộc ở Giai đoạn 3).

## Giai đoạn 5 — Sự kiện, tin tức & media

- CRUD sự kiện + form đăng ký tuyển quân/giải đấu (`/events/[slug]/register`), duyệt đơn.
- Tin tức và gallery quản lý qua dashboard, ảnh lưu Supabase Storage.
- Deploy Vercel + domain chính thức.

## Giai đoạn 6 — Tính năng nâng cao

### Match Center

Cấu trúc 3 cấp:

1. `/matches` — danh sách giải đấu, mới nhất trước.
2. `/matches/[giải]` — các trận trong giải, nhóm theo vòng đấu: Group / Semi / Final.
3. `/matches/[trận]` — tỉ số, recap do AI viết, album ảnh, MVP kèm ảnh upload riêng.

Database:

- `tournaments` — thông tin giải đấu.
- `matches` — có cột `stage` (vòng đấu) và `mvp_member_id` liên kết `members`.
- `match_media` — album ảnh/media của trận.

Dashboard admin: nhập kết quả **một lần** → AI sinh recap + hình scoreboard + caption FB/Insta để copy.

Hỗ trợ cả **trận giao hữu** không thuộc giải nào (match không bắt buộc gắn tournament).
