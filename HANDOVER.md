# HƯỚNG DẪN SỬ DỤNG WEBSITE — CLB Bóng rổ IU

Tài liệu này dành cho **ban điều hành CLB**, không cần biết lập trình. Đọc xong bạn sẽ tự đăng tin, tạo sự kiện, đăng ảnh, mở đợt tuyển quân, điểm danh buổi tập và thêm thành viên mới.

> Mẹo: mọi trang quản trị đều nằm trong khu vực **Dashboard**. Sau khi đăng nhập, bấm tên bạn ở góc phải trên cùng để mở menu, hoặc vào thẳng địa chỉ `tên-miền/dashboard`.

---

## Mục lục

1. [Đăng nhập](#1-đăng-nhập)
2. [Các vai trò làm được gì](#2-các-vai-trò-làm-được-gì)
3. [Đăng tin tức mới](#3-đăng-tin-tức-mới)
4. [Tạo sự kiện](#4-tạo-sự-kiện)
5. [Tạo album và tải ảnh lên](#5-tạo-album-và-tải-ảnh-lên)
6. [Mở / đóng đợt tuyển quân và đăng ký giải đấu](#6-mở--đóng-đợt-tuyển-quân-và-đăng-ký-giải-đấu)
7. [Tạo buổi tập và điểm danh](#7-tạo-buổi-tập-và-điểm-danh)
8. [Xem báo cáo chuyên cần](#8-xem-báo-cáo-chuyên-cần)
9. [Thêm thành viên mới](#9-thêm-thành-viên-mới)
10. [Ai giữ tài khoản gì](#10-ai-giữ-tài-khoản-gì)
11. [Xử lý sự cố thường gặp](#11-xử-lý-sự-cố-thường-gặp)

---

## 1. Đăng nhập

**Website không có chức năng tự đăng ký tài khoản.** Tài khoản do quản trị viên tạo và gửi cho bạn qua email — xem [mục 9](#9-thêm-thành-viên-mới).

### Đăng nhập lần đầu

1. Vào `tên-miền/login` (hoặc bấm nút **Member Login** ở góc phải trên cùng).
2. Nhập **Email** và **Mật khẩu** — dùng mật khẩu tạm trong email chào mừng.
3. Bấm **Đăng nhập**.
4. Hệ thống sẽ **bắt bạn đổi mật khẩu ngay**, không vào được trang nào khác cho tới khi đổi xong. Nhập mật khẩu mới hai lần rồi bấm **Đặt mật khẩu mới**.

Mật khẩu mới phải có **ít nhất 8 ký tự, gồm chữ hoa và số**, và phải khác mật khẩu tạm.

### Quên mật khẩu

1. Ở trang đăng nhập, bấm **Quên mật khẩu?**
2. Nhập email tài khoản, bấm **Gửi liên kết đặt lại**.
3. Mở email, bấm liên kết trong đó, đặt mật khẩu mới.

Nếu không thấy email, kiểm tra thư mục **Spam / Quảng cáo**. Vẫn không có thì nhờ quản trị viên cấp lại mật khẩu tạm bằng nút **Gửi lại email mời** (xem [mục 9](#9-thêm-thành-viên-mới)).

### Đăng xuất

Bấm tên bạn ở góc phải trên cùng → **Đăng xuất**. Hoặc vào `/dashboard` và bấm nút **Đăng xuất** ở cuối trang.

---

## 2. Các vai trò làm được gì

Mỗi tài khoản có **đúng một vai trò**. Vai trò quyết định bạn thấy và làm được gì.

| Việc | Admin | Ban điều hành<br>(executive_board) | Ban truyền thông<br>(media) | Thành viên<br>(member) |
|---|:---:|:---:|:---:|:---:|
| Xem nội dung công khai (tin tức, sự kiện, ảnh) | ✅ | ✅ | ✅ | ✅ |
| Điểm danh buổi tập bằng mã | ✅ | ✅ | ✅ | ✅ |
| Sửa hồ sơ cá nhân, đổi mật khẩu | ✅ | ✅ | ✅ | ✅ |
| Xem chuyên cần **của chính mình** | ✅ | ✅ | ✅ | ✅ |
| Viết và đăng **tin tức** | ✅ | ✅ | ✅ | ❌ |
| Tạo và đăng **sự kiện** | ✅ | ✅ | ✅ | ❌ |
| Tạo **album**, tải ảnh lên | ✅ | ✅ | ✅ | ❌ |
| Xem **đơn tuyển quân** (có thông tin cá nhân sinh viên) | ✅ | ✅ | ❌ | ❌ |
| Xem **đội đăng ký giải**, duyệt / từ chối | ✅ | ✅ | ❌ | ❌ |
| **Thêm thành viên**, khoá / mở khoá tài khoản | ✅ | ✅ | ❌ | ❌ |
| Đổi **vai trò** của người khác | ✅ | ✅ | ❌ | ❌ |
| Tạo **buổi tập**, điểm danh hộ | ✅ | ✅ | ❌ | ❌ |
| Xem **báo cáo chuyên cần toàn CLB** | ✅ | ✅ | ❌ | ❌ |
| **Mở / đóng** đợt tuyển quân và đăng ký giải | ✅ | ✅ | ❌ | ❌ |

### Nên giao vai trò nào cho ai

- **Admin** — chủ nhiệm CLB hoặc người phụ trách kỹ thuật. Giữ **ít nhất 2 người** để không bị kẹt khi một người bận hoặc ra trường.
- **Ban điều hành** — phó chủ nhiệm, thư ký, người quản lý tập luyện. Làm được gần như mọi việc trừ những thao tác nhạy cảm nhất.
- **Ban truyền thông** — người viết bài, chụp ảnh, làm nội dung. Đăng bài và ảnh thoải mái nhưng **không xem được thông tin cá nhân của sinh viên** trong đơn tuyển quân — đây là chủ ý, không phải lỗi.
- **Thành viên** — tất cả thành viên còn lại.

> ⚠️ **Đừng giao vai trò cao hơn mức cần thiết.** Đơn tuyển quân chứa họ tên, MSSV, email và số điện thoại của sinh viên. Chỉ những người thật sự cần mới nên xem được.

---

## 3. Đăng tin tức mới

**Vai trò cần có:** Ban truyền thông trở lên.

1. Vào **Dashboard → Bài viết** (`/dashboard/posts`).
2. Bấm **Viết bài**.
3. Điền:
   - **Tiêu đề** — bắt buộc. Địa chỉ bài viết (slug) tự sinh ra từ tiêu đề, không cần đụng tới. Nếu trùng tên bài cũ, hệ thống tự thêm năm hoặc số vào sau.
   - **Chuyên mục** — Tường thuật / Thông báo / Thành tích / Khác.
   - **Đoạn tóm tắt** — một hai câu, hiện ở trang chủ và danh sách tin. Có đếm ký tự, đừng viết quá dài.
   - **Ảnh bìa** — bấm **Chọn ảnh bìa**. Không bắt buộc nhưng nên có, bài sẽ đẹp hơn nhiều.
   - **Nội dung** — soạn ở khung bên trái, xem trước ngay bên phải.
4. Bấm **Lưu nháp** hoặc **Đăng bài**:
   - **Lưu nháp** — chỉ bạn và ban quản trị thấy. Bài đang soạn còn tự lưu định kỳ nên đóng nhầm tab cũng không mất.
   - **Đăng bài** — bài hiện ngay ở trang chủ và trang `/news`.

### Cách viết nội dung

Khung soạn bài dùng cú pháp đơn giản, gõ thế nào thì khung xem trước hiện ra thế ấy:

| Muốn | Gõ |
|---|---|
| Tiêu đề mục | `## Diễn biến trận đấu` |
| Chữ **đậm** | `**chữ đậm**` |
| Chữ *nghiêng* | `*chữ nghiêng*` |
| Gạch đầu dòng | `- Nội dung` rồi Enter, dòng sau tự có gạch đầu dòng |
| Danh sách đánh số | `1. Nội dung` rồi Enter, số tự tăng |
| Câu trích dẫn | `> Cả đội đã chơi rất tốt.` |
| Liên kết | `[chữ hiện ra](https://địa-chỉ)` |

Danh sách hoạt động giống Word: Enter xuống dòng mới cùng kiểu, Tab thụt vào, Enter trên dòng trống thì thoát khỏi danh sách.

**Chèn ảnh vào giữa bài:** bấm nút 🖼 **Chèn ảnh** trên thanh công cụ, chọn file, rồi chọn **Kích thước** và **Căn lề** cho ảnh. Có thể thêm **Chú thích** hiện dưới ảnh.

### Sửa hoặc gỡ bài đã đăng

Ở danh sách bài viết, bấm vào bài để sửa. Muốn gỡ xuống thì đổi trạng thái từ **Đã đăng** về **Nháp** — bài biến khỏi trang công khai nhưng vẫn còn trong hệ thống. Nút **Xoá bài viết** thì xoá hẳn, không lấy lại được.

---

## 4. Tạo sự kiện

**Vai trò cần có:** Ban truyền thông trở lên.

1. Vào **Dashboard → Sự kiện** (`/dashboard/events`).
2. Bấm **Tạo sự kiện**.
3. Điền:
   - **Tiêu đề** — bắt buộc.
   - **Loại sự kiện** — Tuyển quân / Trận đấu / Giải đấu / Team building / Khác. Chọn đúng loại vì nút bấm ở trang chủ thay đổi theo loại (xem bảng dưới).
   - **Ngày diễn ra** — **để trống nếu chưa chốt ngày**, trang công khai sẽ hiện **TBA**.
   - **Giờ bắt đầu / kết thúc**, **Địa điểm**.
   - **Mô tả ngắn** — một hai câu hiện ở danh sách.
   - **Nội dung chi tiết** — thể lệ, lịch trình, yêu cầu chuẩn bị. Soạn giống bài viết.
   - **Ảnh bìa** — không bắt buộc.
   - **Cho thành viên bấm tham gia** — bật nếu muốn thành viên tự đăng ký tham gia. Có thể đặt **Giới hạn số người**; để trống là không giới hạn.
4. Sự kiện mới luôn được lưu ở dạng **nháp**. Về danh sách, bấm **Đăng** để công khai.

### Nút nào hiện ở trang chủ

| Loại sự kiện | Nút hiện ra |
|---|---|
| Tuyển quân | **Register** → dẫn tới form tuyển quân. Nếu đợt đang đóng thì thành **Sắp mở** (bấm không được) |
| Giải đấu | **Register a Team** → dẫn tới form đăng ký đội. Nếu đợt đang đóng thì thành **Sắp mở** |
| Loại khác, có bật "cho tham gia" | **Tham gia** — thành viên phải đăng nhập mới bấm được |
| Còn lại | **Chi tiết** |

Trang chủ chỉ hiện **3 sự kiện sắp tới gần nhất**. Sự kiện chưa chốt ngày (TBA) xếp sau các sự kiện đã có ngày. Muốn xem đủ thì vào `/events`.

---

## 5. Tạo album và tải ảnh lên

**Vai trò cần có:** Ban truyền thông trở lên.

### Tạo album

1. Vào **Dashboard → Album ảnh** (`/dashboard/albums`).
2. Bấm **Tạo album**.
3. Điền **Tiêu đề**, **Ngày**, **Mô tả**. Nếu album thuộc một sự kiện đã có, chọn ở ô **Liên kết sự kiện** — album sẽ tự hiện ở cuối trang sự kiện đó.
4. Bấm **Tạo album**. Album mới ở dạng **nháp**, chưa ai ngoài ban quản trị thấy.

### Tải ảnh lên

1. Bấm vào album vừa tạo để mở ra.
2. **Kéo thả nhiều ảnh cùng lúc** vào khung, hoặc bấm khung để chọn file.
3. Mỗi ảnh có thanh tiến trình riêng. Hệ thống tự nén ảnh xuống tối đa 1600px và tạo bản thu nhỏ, nên **cứ tải ảnh gốc từ máy ảnh hoặc điện thoại, không cần tự resize**.
4. **Đừng đóng trang khi còn ảnh đang tải** — sẽ có dòng nhắc "Đang tải ảnh lên, vui lòng không đóng trang…".

### Sắp xếp và chỉnh sửa

- **Đổi thứ tự:** kéo thả ảnh, hoặc bấm mũi tên ◀ ▶ trên từng ảnh.
- **Thêm chú thích:** bấm vào dòng "Thêm chú thích…" dưới ảnh, gõ rồi bấm ra ngoài.
- **Đặt ảnh bìa:** bấm nút **Ảnh bìa** trên ảnh muốn chọn. Ảnh bìa hiện ở trang `/gallery`.
- **Xoá ảnh:** bấm **Xoá**. Ảnh bị xoá khỏi kho lưu trữ luôn, không lấy lại được.

### Cho album hiện ra ngoài

Về danh sách album, bấm **Đăng**. Ảnh sẽ hiện ở trang `/gallery` và trong lưới ảnh ở trang chủ.

> ⚠️ **Kiểm tra kỹ ảnh trước khi đăng.** Đừng tải lên ảnh chụp căn cước, thẻ sinh viên, bảng điểm hay bất cứ giấy tờ nào có thông tin cá nhân — album đã đăng là công khai với toàn bộ internet.

---

## 6. Mở / đóng đợt tuyển quân và đăng ký giải đấu

**Vai trò cần có:** Ban điều hành trở lên.

Vào **Dashboard → Cài đặt đợt đăng ký** (`/dashboard/settings`). Có hai đợt riêng biệt:

- **Tuyển quân** — điều khiển form ở `/tryout`.
- **Giải đấu 3x3** — điều khiển form đăng ký đội ở `/tournament-signup`.

Với mỗi đợt, điền:

| Ô | Ý nghĩa |
|---|---|
| **Bật đợt đăng ký** | Công tắc chính. Tắt là đóng ngay lập tức. |
| **Tên đợt** | VD: "Tuyển quân mùa Thu 2026". Hiện cho người đăng ký thấy. |
| **Ngày mở** | Để trống = mở ngay khi bật công tắc. Có ngày = chưa tới ngày đó thì vẫn đóng. |
| **Ngày đóng** | Quá thời điểm này đợt **tự đóng**, kể cả công tắc vẫn đang bật. |
| **Nội dung hiện khi đóng** | Câu hiện cho người vào lúc đợt chưa mở. VD: "Đợt tuyển quân chưa mở. Theo dõi fanpage để nhận thông báo." |

Bấm **Lưu thay đổi**. Trạng thái hiện tại hiện ngay bên cạnh: **Đang mở** hoặc **Đang đóng**.

> Đợt đóng thì **không ai gửi được đơn**, kể cả người biết đường dẫn trực tiếp — chặn nằm ở tầng cơ sở dữ liệu chứ không chỉ ẩn nút.

### Xem đơn tuyển quân

**Dashboard → Xem đơn tuyển quân** (`/dashboard/recruits`).

- Lọc theo trạng thái và vị trí, tìm theo tên hoặc MSSV.
- Bấm vào một dòng để xem đầy đủ đơn.
- Đổi trạng thái đơn: **Chờ duyệt** → **Đậu** hoặc **Loại**.
- Đơn đã đánh **Đậu** sẽ hiện thêm nút **Kết nạp** — bấm để tạo thẳng tài khoản thành viên, thông tin điền sẵn từ đơn.
- Nút **Xuất Excel** tải danh sách đang hiển thị (đúng bộ lọc hiện tại) về máy.

### Xem đội đăng ký giải

**Dashboard → Đội đăng ký giải** (`/dashboard/teams`).

- Lọc theo trạng thái và giải, tìm theo tên đội, mã đội, tên hoặc MSSV vận động viên.
- Bấm vào một đội để xem đội hình đầy đủ, rồi bấm **Duyệt đội** hoặc **Từ chối**.
- **Xuất Excel** tạo file hai sheet: danh sách đội và đội hình chi tiết từng người.

Mỗi đội có một **mã đội** dạng `IU3X3-XXXXX`, hiện cho đội trưởng ngay sau khi đăng ký. Dùng mã này để tra cứu khi đối chiếu thông tin hoặc xếp lịch thi đấu.

---

## 7. Tạo buổi tập và điểm danh

**Vai trò cần có:** Ban điều hành trở lên (để tạo buổi tập). Mọi thành viên đều tự điểm danh được.

### Tạo buổi tập

1. Vào **Dashboard → Buổi tập & điểm danh** (`/dashboard/sessions`).
2. Bấm **Tạo buổi tập**.
3. Điền **Tiêu đề**, **Ngày**, **Giờ bắt đầu / kết thúc**, **Địa điểm**, **Ghi chú**.
4. Muốn tạo lịch cố định nhiều tuần: bật **Tạo lịch hàng tuần**, chọn **Thứ trong tuần**, **Bắt đầu từ ngày** và **Số tuần** (tối đa 26). Hệ thống tạo sẵn toàn bộ các buổi.
5. Muốn giới hạn thời gian điểm danh: bật **Tự đặt khoảng thời gian check-in**, điền **Mở check-in lúc** và **Đóng check-in lúc**. Ngoài khoảng này mã không dùng được.

### Điểm danh tại sân

1. Bấm vào buổi tập để mở trang chi tiết.
2. Màn hình hiện **mã 6 chữ số cỡ lớn** — chiếu lên máy chiếu, hoặc giơ điện thoại cho cả đội thấy.
3. Thành viên vào `tên-miền/checkin` (hoặc menu tài khoản → **Điểm danh**), gõ mã, xong.
4. Danh sách bên dưới cập nhật theo thời gian thực, kèm giờ check-in từng người.

Hệ thống tự phân biệt **Có mặt đúng giờ** và **Đi trễ** dựa theo giờ bắt đầu buổi tập.

### Các thao tác khác trên trang buổi tập

- **Hiện mã toàn màn hình** — phóng mã to hết cỡ để cả đội nhìn thấy từ xa.
- **Điểm danh hộ** — cho người quên điện thoại hoặc hết pin. Chọn thành viên, chọn trạng thái (Có mặt / Đi trễ / Có phép / Vắng).
- **Đổi mã** — dùng khi nghi mã bị lộ ra ngoài cho người không có mặt. Mã cũ mất hiệu lực ngay.
- **Đóng check-in sớm** — chốt sổ trước giờ. Sau khi đóng thì mã không dùng được nữa, nhưng vẫn điểm danh hộ được.

> Trang buổi tập hiển thị tốt trên điện thoại vì ban điều hành thường dùng điện thoại ngay tại sân.

---

## 8. Xem báo cáo chuyên cần

**Vai trò cần có:** Ban điều hành trở lên.

Vào **Dashboard → Báo cáo chuyên cần** (`/dashboard/attendance`).

1. Chọn **Kỳ thống kê** — hoặc tự đặt **Từ ngày** / **Đến ngày**.
2. Bảng hiện từng thành viên với số buổi **Có mặt**, **Đi trễ**, **Có phép**, **Vắng** và **tỉ lệ chuyên cần**.
3. Màu cho biết tình hình ngay:
   - 🟢 **Xanh** — từ 80% trở lên
   - 🟡 **Vàng** — 50% đến dưới 80%
   - 🔴 **Đỏ** — dưới 50%
4. Bấm vào một thành viên để xem **từng buổi tập** họ có mặt hay vắng.
5. **Xuất Excel** tải báo cáo về máy, giữ nguyên màu và bộ lọc đang chọn.

Có thể lọc theo vai trò, và xem nhanh **Top 5 chuyên cần nhất** ở đầu trang.

> Thành viên tự xem chuyên cần của mình ở **Hồ sơ của tôi** (`/dashboard/profile`) — không thấy được của người khác.

---

## 9. Thêm thành viên mới

**Vai trò cần có:** Ban điều hành trở lên.

### Tạo tài khoản

1. Vào **Dashboard → Quản lý thành viên** (`/dashboard/members`).
2. Bấm **Thêm thành viên**.
3. Điền **Email** (bắt buộc, dùng để đăng nhập), **Họ và tên** (bắt buộc), **MSSV**, **Số điện thoại**, **Vai trò**, **Vị trí**, **Chiều cao**, **Năm vào CLB**.
4. Để bật **Gửi email tự động kèm mật khẩu tạm** nếu muốn hệ thống gửi email chào mừng thay bạn.
5. Bấm **Tạo tài khoản**.

Sau khi tạo, màn hình hiện **email và mật khẩu tạm**. Bấm **Copy thông tin** để lưu lại.

- Nếu email gửi thành công → xong, người đó tự nhận được.
- Nếu email **gửi thất bại** → màn hình báo rõ, bạn gửi thủ công thông tin vừa copy cho họ qua Zalo hoặc Messenger.

Người mới **bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên**. Trong bảng thành viên, cột **MK tạm** cho biết ai còn chưa đổi.

### Kết nạp thẳng từ đơn tuyển quân

Nhanh hơn: vào **Xem đơn tuyển quân**, đánh dấu đơn là **Đậu**, rồi bấm **Kết nạp**. Thông tin điền sẵn từ đơn, chỉ cần chọn vai trò rồi bấm tạo.

### Khoá / mở khoá tài khoản

Dùng khi thành viên ra trường, nghỉ CLB, hoặc tài khoản có dấu hiệu bị lộ.

Trong bảng thành viên, bấm vào người đó → **Khoá tài khoản**. Người bị khoá **bị đăng xuất ngay** và không đăng nhập lại được. Bấm **Mở khoá tài khoản** để cho phép lại.

> Bạn **không tự khoá chính mình được** — đây là chốt an toàn để CLB không bị khoá hết tài khoản quản trị.

### Đổi vai trò

Bấm vào thành viên, đổi ô **Vai trò**, bấm **Lưu thay đổi**.

> ⚠️ Trước khi hạ vai trò của một Admin, hãy chắc chắn **vẫn còn ít nhất một Admin khác**. Nếu không còn Admin nào, sẽ không ai đổi lại được vai trò cho người khác.

---

## 10. Ai giữ tài khoản gì

Website chạy được nhờ 4 dịch vụ bên ngoài. **Điền bảng dưới và cập nhật mỗi khi bàn giao khoá nhiệm kỳ.** Đây là phần quan trọng nhất của tài liệu này — mất quyền truy cập những tài khoản này thì website không sửa được nữa.

### Bảng bàn giao

| Dịch vụ | Dùng để làm gì | Email / tài khoản đăng ký | Người giữ hiện tại | Cập nhật lần cuối |
|---|---|---|---|---|
| **Supabase** | Lưu toàn bộ dữ liệu: thành viên, tin tức, sự kiện, ảnh, điểm danh | _(điền)_ | _(điền)_ | _(điền)_ |
| **Vercel** | Chạy website, cấp tên miền | _(điền)_ | _(điền)_ | _(điền)_ |
| **GitHub** | Lưu mã nguồn website | _(điền)_ | _(điền)_ | _(điền)_ |
| **Resend** | Gửi email chào mừng và đặt lại mật khẩu | _(điền)_ | _(điền)_ | _(điền)_ |
| **Tên miền** | Địa chỉ website | _(điền)_ | _(điền)_ | _(điền)_ |
| **Fanpage Facebook** | Kênh truyền thông chính | _(điền)_ | _(điền)_ | _(điền)_ |

Kho mã nguồn hiện tại: `github.com/khathien-ui/iu-basketball-club`
Fanpage: `facebook.com/IUBASKETBALLL`

### Quy tắc bảo mật

1. **Mỗi dịch vụ nên có ít nhất 2 người truy cập được.** Một người ra trường hoặc mất điện thoại thì CLB vẫn vào được.
2. **Đừng dùng email cá nhân của sinh viên** để đăng ký các dịch vụ này — dùng một email chung của CLB, bàn giao mật khẩu email đó khi chuyển khoá.
3. **Bật xác thực hai bước** cho GitHub và Supabase. Lưu mã dự phòng ở nơi ban chủ nhiệm truy cập được.
4. **Không bao giờ gửi khoá bí mật qua chat công khai.** Đặc biệt là khoá `service_role` của Supabase và khoá API của Resend — ai có chúng là đọc và sửa được toàn bộ dữ liệu, bỏ qua mọi phân quyền.
5. Các khoá này nằm trong một file tên `.env.local` **không được đưa lên GitHub**. Nếu lỡ để lộ, vào Supabase và Resend **tạo khoá mới ngay**, khoá cũ mất hiệu lực.

### Khi bàn giao khoá mới

- [ ] Thêm người mới vào từng dịch vụ ở bảng trên
- [ ] Tạo tài khoản website vai trò **Admin** cho ban chủ nhiệm mới
- [ ] Hạ vai trò các thành viên đã ra trường xuống **member**, hoặc **khoá tài khoản** của họ
- [ ] Đổi mật khẩu email chung của CLB
- [ ] Cập nhật lại bảng bàn giao ở trên
- [ ] Gỡ quyền truy cập của người đã bàn giao xong

---

## 11. Xử lý sự cố thường gặp

**Không đăng nhập được**
Kiểm tra gõ đúng email chưa. Thử **Quên mật khẩu?**. Nếu báo tài khoản bị khoá, liên hệ quản trị viên — có thể tài khoản đã bị khoá chủ động.

**Thành viên không nhận được email chào mừng**
Nhắc họ kiểm tra **Spam**. Không có thì vào **Quản lý thành viên**, bấm vào người đó rồi bấm **Gửi lại email mời**, hoặc copy mật khẩu tạm gửi tay.

**Đăng bài rồi mà trang chủ không thấy**
Trang chủ chỉ hiện **3 bài mới nhất**. Kiểm tra bài đã ở trạng thái **Đã đăng** chưa (không phải **Nháp**). Vào `/news` xem danh sách đầy đủ.

**Ảnh tải lên bị lỗi giữa chừng**
Thường do mạng. Tải lại trang rồi thử lại — ảnh đã lên xong vẫn còn, chỉ cần tải lại ảnh bị thiếu.

**Thành viên báo không điểm danh được**
Kiểm tra buổi tập còn **Đang mở check-in** không, và mã trên màn hình có khớp mã họ gõ không. Nếu đã **đóng check-in** thì dùng **Điểm danh hộ**.

**Người ngoài gửi được đơn dù đã đóng đợt?**
Không xảy ra — chặn nằm ở tầng cơ sở dữ liệu. Nếu thấy đơn mới sau khi đóng, kiểm tra lại **Ngày đóng** ở trang cài đặt xem đã qua chưa.

---

## Việc kỹ thuật còn tồn (dành cho người phụ trách kỹ thuật)

- **Migration `009_teams.sql` chưa chạy trên Supabase.** Cho tới khi chạy, trang **Đội đăng ký giải** và form `/tournament-signup` chưa hoạt động. Cách chạy: mở Supabase → **SQL Editor** → dán toàn bộ nội dung file `supabase/migrations/009_teams.sql` → **Run**.
- Các việc còn lại và lịch trình xem ở [ROADMAP.md](ROADMAP.md).
- Quy ước kỹ thuật và hướng dẫn cho lập trình viên xem ở [CLAUDE.md](CLAUDE.md).
