# BHB

> 🇬🇧 [English version](README.en.md)

Userscript tự động hoá game giải trí Gacha + bắt Pokemon + Thời trang.

Bot đọc thẳng framebuffer WebGL của game để nhận biết nút bấm theo màu, rồi gửi sự kiện chuột giả vào canvas. **Con trỏ chuột thật không hề di chuyển** — bạn vẫn dùng máy bình thường trong lúc bot chạy.

---

## Cài đặt

### Bước 1 — Cài Tampermonkey

Cài [Tampermonkey](https://www.tampermonkey.net/) cho Chrome, Edge, Firefox hoặc Brave.

### Bước 2 — Bật quyền chạy User Scripts ⚠️ (Chrome/Edge)

**Bỏ qua bước này là script sẽ không chạy, không báo lỗi gì cả.** Từ Chrome/Edge 138 trở đi, API dành cho userscript bị khoá sau một công tắc riêng.

1. Gõ `chrome://extensions` (hoặc `edge://extensions`) vào thanh địa chỉ
2. Tìm **Tampermonkey**, bấm **Details** / **Chi tiết**
3. Kéo xuống, gạt **"Allow User Scripts"** sang **ON**

> Công tắc này nằm trong trang chi tiết **của riêng Tampermonkey**, không phải trang quản lý extension chung.

Nếu dùng Chrome/Edge **cũ hơn 138** và không thấy công tắc đó: bật **Developer mode** ở góc phải trên trang `chrome://extensions`.

**Firefox không cần bước này.**

### Bước 3 — Cài script

1. Mở link: **[dist/bhb.user.js](https://raw.githubusercontent.com/hungnm-ict/bhb/master/dist/bhb.user.js)**
2. Tampermonkey hiện trang cài đặt → bấm **Install**
3. Mở game, bấm phím **`1`** để xem bảng phím tắt

> Nếu bấm `1` không hiện gì: gần như chắc chắn là Bước 2 chưa xong. Mở Console (F12) tìm dòng `[BHB] ready` — không có nghĩa là script chưa chạy.

Từ lần sau **script tự cập nhật** — không phải cài lại. Tampermonkey tự kiểm tra bản mới; muốn cập nhật ngay thì vào Tampermonkey → Dashboard → tab **Installed userscripts** → bấm **Check for userscript updates**.

---

## Giao diện

Bot hiện một **thanh nhỏ** ở góc phải trên mặt game: chấm trạng thái, tốc độ, và dòng mô tả bot đang làm gì. Không đụng vào 4 giây thì nó tự mờ đi để khỏi che game; rê chuột vào là rõ lại.

Bấm vào thanh đó (hoặc phím `1`) để mở **bảng điều khiển**, gồm 6 tab:

| Tab | Nội dung |
|---|---|
| **Chạy** | Công tắc bật/tắt từng chế độ (kể cả Chạy tất cả), thanh trượt tốc độ, cỡ canvas, đếm ngược tự tắt |
| **Thao tác** | Bảng thao tác: đổi tên, bật/tắt, gán hoạt động, giới hạn theo màn hình, sắp xếp ưu tiên, xoá |
| **Màn hình** | Vùng nhận diện màn hình game, có ✓/✗ và tỉ lệ khớp trực tiếp |
| **Cài đặt** | Hồ sơ (mỗi nhân vật một cái), hàng đợi hoạt động, tự tải lại khi treo, ngôn ngữ, xuất/nhập |
| **Nhật ký** | Từng việc bot đã làm, mới nhất trên cùng |
| **?** | Bảng tra phím tắt |

Một **thao tác** là "thấy màu này ở chỗ này (trên màn hình này) thì bấm vào đó". Thứ tự trong bảng là **độ ưu tiên**, không phải trình tự — trình tự đến từ cột màn hình.

Khi mở tab **Thao tác**, mỗi thao tác được vẽ thành một **dấu ngay trên canvas** tại đúng chỗ nó nhìn vào. Rê chuột lên dòng nào thì dấu tương ứng sáng lên và ngược lại — nhìn là biết rule trỏ vào nút nào.

### Tạo rule

Rê chuột lên nút trong game, rồi bấm **Bắt thao tác tại con trỏ** (hoặc phím `0`). Xong.

Bot tự xử lý chuyện nút bị sáng lên do con trỏ đang nằm trên đó: nó gạt **con trỏ ảo** ra góc canvas, đợi game vẽ lại, đọc màu lúc nút không sáng, rồi trả con trỏ ảo về chỗ cũ. Con trỏ thật của bạn không hề nhúc nhích. Cả hai màu — lúc sáng và lúc thường — đều được lưu, nên rule khớp được ở cả hai trạng thái.

### Phím tắt

| Phím | Chức năng |
|:---:|---|
| `1` | Mở/đóng bảng điều khiển |
| `3` | Auto Rerun — tìm 3 giây/lần, click xong nghỉ 20 giây |
| `4` | Auto World Boss Solo — 2 giây/lần |
| `5` | Auto Script — chạy rule bạn tự tạo, 3 giây/lần |
| `6` | Chạy tất cả — lần lượt mọi hoạt động trong hàng đợi (cần có thao tác đã gán) |
| `0` | Bắt rule tại con trỏ |
| `= / +` | Tăng tốc độ game (mốc kế tiếp, tối đa 20×) |
| `-` | Giảm tốc độ game (chậm nhất 0.1×) |

---

## Tính năng

- **Chỉnh tốc độ game 0.1× – 20×** — can thiệp đồng hồ và khung hình của game, không phải tua nhanh giả
- **Không chiếm chuột** — gửi sự kiện thẳng vào canvas, con trỏ thật đứng yên
- **Chạy nền được** — game không bị treo khi bạn chuyển sang tab khác
- **Rule tự tạo** — chỉ vào nút nào là bot tự học vị trí + màu nút đó
- **So khớp cả vùng** — thay vì 1 pixel, bot đọc cả một khung và chấm 16 điểm mẫu, nên một hiệu ứng lướt qua không làm rule sai
- **Biết đang ở màn hình nào** — rule chỉ chạy ở màn hình bạn cho phép, và màn hình "hết vé" sẽ tự chuyển sang hoạt động khác
- **Chạy tất cả** — hàng đợi hoạt động chạy từ trên xuống, hết tài nguyên thì sang mục kế, hết một vòng thì quay lại từ đầu
- **Rule không phụ thuộc độ phân giải** — xem mục dưới
- **Tự tải lại khi game treo** — bật trong Cài đặt; không bật thì bot chỉ dừng sau 3 phút không làm gì

### Rule không phụ thuộc độ phân giải

Đây là khác biệt lớn nhất so với bản gốc.

Bản gốc lưu toạ độ pixel trần. Trên macOS canvas bị ghim ở một kích thước tối thiểu nên không sao, **nhưng trên Windows framebuffer thay đổi theo cửa sổ và độ phân giải màn hình** — đổi zoom, kéo cửa sổ, hay chuyển sang màn hình khác DPI là mọi rule lệch hết.

BHB lưu kèm **kích thước framebuffer lúc chụp rule**, nên rule tự quy đổi sang khung hình hiện tại. Đổi cỡ cửa sổ hay zoom vẫn chạy đúng.

Rule nhập từ bản cũ không có thông tin này, nên overlay đánh dấu **⚠ màu cam** — nên bấm `0` chụp lại cho chắc.

### Nhiều nhân vật, nhiều tài khoản

Mỗi **hồ sơ** trong tab Cài đặt giữ rule, màn hình và hàng đợi riêng — mỗi nhân vật một hồ sơ, đổi bằng dropdown. Việc bấm đổi nhân vật *trong game* thì vẫn phải bắt rule như mọi thao tác khác.

Tài khoản khác thì không cần gì thêm: mở một **browser profile** khác là có một `localStorage` khác, nên script tự có bộ cấu hình riêng ở đó.

---

> 📋 Kế hoạch các tính năng tiếp theo: [docs/ROADMAP.md](docs/ROADMAP.md)

## Phát triển

```bash
npm install
npm run build     # tạo dist/bhb.user.js
npm run watch     # tự build lại khi sửa code
npm test          # chạy unit test
```

Sửa code trong `src/`, chạy `npm run build`, rồi reload trang game. Muốn phát hành bản mới cho các browser khác tự nhận: tăng `version` trong `package.json`, build, commit, push.

### Cấu trúc

```
src/
├── main.js          điểm vào — thứ tự khởi tạo nằm ở đây
├── core/
│   ├── canvas.js    tìm canvas, ép preserveDrawingBuffer
│   ├── coords.js    quy đổi toạ độ — chỗ xử lý vấn đề độ phân giải
│   ├── pixel.js     đọc pixel từ WebGL
│   ├── input.js     dispatch click giả
│   ├── speed.js     tăng tốc game
│   ├── engine.js    vòng lặp tự động
│   └── storage.js   profile + cài đặt
├── rules/           model rule, rule có sẵn, bắt/sửa rule
├── ui/              HUD, bảng điều khiển, dấu trên canvas, phím tắt
└── i18n/            tiếng Việt + tiếng Anh
```

---

## Nguồn gốc

Dự án khởi đầu từ [`laviehihi/bh-scripts`](https://github.com/laviehihi/bh-scripts) — cảm ơn tác giả đã tìm ra cách đọc framebuffer, bộ toạ độ/màu nút đã kiểm chứng, và kỹ thuật tăng tốc game. Phần kiến thức đó vẫn là nền tảng của bot này.

Code đã được viết lại hoàn toàn. Chi tiết xem [NOTICE.md](NOTICE.md).

## Lưu ý

Công cụ này dành cho mục đích học tập và dùng cá nhân. Tự động hoá game có thể vi phạm điều khoản dịch vụ của nền tảng hoặc của nhà phát hành — bạn tự chịu trách nhiệm khi sử dụng.
