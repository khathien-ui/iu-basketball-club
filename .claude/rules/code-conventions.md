---
paths:
  - "**/*.{ts,tsx,js,jsx,html,css}"
---

# Quy ước code

- App Router (`app/`), Server Components mặc định; chỉ dùng `"use client"` khi thực sự cần tương tác/state.
- Tailwind: không tạo file CSS riêng trừ khi cần override global (font-face, base reset). (Prototype tĩnh hiện tại dùng `css/styles.css` thuần — chấp nhận cho giai đoạn này.)
- Form đăng ký (tuyển quân, giải đấu) validate cả client lẫn server (server action / Supabase RLS) — không tin dữ liệu chỉ vì client đã validate.
- Ảnh upload qua Supabase Storage, không commit ảnh media vào repo. `resend.com_.png` ở root là ảnh tham khảo design, không phải asset sản phẩm — không đưa vào `public/` khi build thật.
