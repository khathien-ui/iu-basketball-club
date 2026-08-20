# Cấu trúc trang (điều hướng chính)

```
Home
About Us
Executive Board
Members          (khu vực có đăng nhập)
Events
Gallery
News
Contact
```

- Các trang công khai: Home, About Us, Executive Board, Events (danh sách), Gallery, News, Contact.
- Members: trang danh sách/hồ sơ thành viên — một phần công khai (giới thiệu), một phần chỉ hiển thị đầy đủ khi đăng nhập.
- Trang đăng ký sự kiện (tuyển quân, giải đấu) là sub-route của Events, ví dụ `/events/[slug]/register`.
- Đặt tên route/thư mục bằng tiếng Anh (khớp menu).
