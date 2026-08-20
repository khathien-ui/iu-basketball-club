# Tech stack

- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Backend/DB/Auth/Storage**: Supabase (Postgres, Supabase Auth, Supabase Storage cho ảnh/media)
- **Deployment**: Vercel (mặc định đề xuất — có thể đổi nếu trường/CLB có hosting riêng)

Không dùng CSS-in-JS, không dùng UI kit nặng (MUI, AntD) — giữ đúng tinh thần tối giản của design system. Nếu cần component primitives, ưu tiên [shadcn/ui](https://ui.shadcn.com) (copy-in, không phải dependency) vì nó hợp với thẩm mỹ tối giản/kỹ thuật.

## Giai đoạn hiện tại

Đang ở giai đoạn **prototype tĩnh** (`index.html` + `css/styles.css` + `js/main.js`, không build step) để chốt design trước khi port sang Next.js. Ảnh `resend.com_.png` ở root là ảnh tham khảo design; logo sản phẩm nằm ở `assets/logo.png`.
