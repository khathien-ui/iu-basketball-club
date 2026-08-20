---
paths:
  - "**/*.{html,tsx,jsx,mdx}"
---

# Ngôn ngữ nội dung

- **Tiêu đề lớn (h1/h2 section titles), nav, nút bấm, chức danh, tên sự kiện**: tiếng Anh.
- **Nội dung nhỏ (đoạn mô tả, subtitle, lede, quote, eyebrow label, địa chỉ footer)**: tiếng Việt có dấu.
- Không cần framework i18n đầy đủ (next-intl…) trừ khi CLB yêu cầu song ngữ toàn site sau này. Với nội dung song ngữ theo bài, lưu 2 field (`content_vi`, `content_en` — field sau có thể để trống) trong bảng dữ liệu thay vì dùng route locale.
- Nội dung có thể do ban điều hành chỉnh sửa (tin tức, sự kiện) không hardcode trong component — lấy từ dữ liệu.
