# Tech stack

- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Backend/DB/Auth/Storage**: Supabase (Postgres, Supabase Auth, Supabase Storage cho ảnh/media)
- **Deployment**: Vercel (mặc định đề xuất — có thể đổi nếu trường/CLB có hosting riêng)

Không dùng CSS-in-JS, không dùng UI kit nặng (MUI, AntD) — giữ đúng tinh thần tối giản của design system. Nếu cần component primitives, ưu tiên [shadcn/ui](https://ui.shadcn.com) (copy-in, không phải dependency) vì nó hợp với thẩm mỹ tối giản/kỹ thuật.

## Giai đoạn hiện tại

Đã **migrate sang Next.js 14 App Router + TypeScript** (2026-08-20), giữ nguyên 100% design/nội dung từ prototype tĩnh:

- `app/layout.tsx` — root layout, `lang="vi"`, import `css/styles.css` làm global CSS, favicon SVG inline.
- `app/page.tsx` — compose 11 component: Navbar, Hero, Features, About, ExecutiveBoard, EventsList, Gallery, News, Testimonials, CTA, Footer (trong `components/`).
- Client components: `Navbar` (scroll border + mobile menu bằng React state) và `ScrollEffects` (scroll reveal qua IntersectionObserver, hỗ trợ `?noanim` cho screenshot); các component còn lại là Server Components.
- Logo serve từ `public/assets/logo.png`.
- Nút **Member Login đang ẩn** (đã bỏ khỏi Navbar theo yêu cầu) — thêm lại khi làm tính năng đăng nhập.
- Chạy dev: `npm run dev` (port 3000).

File prototype cũ (`index.html`, `js/main.js`) vẫn còn ở root để tham khảo, không còn được serve. Ảnh `resend.com_.png` ở root là ảnh tham khảo design; `assets/logo.png` là bản gốc logo (bản dùng thật ở `public/assets/`).
