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

## Phím tắt

| Phím | Chức năng |
|:---:|---|
| `1` | Hiện/ẩn bảng trợ giúp |
| `2` | Overlay: mở rộng → thu nhỏ → ẩn |
| `3` | Auto Rerun — tìm 3 giây/lần, click xong nghỉ 20 giây |
| `4` | Auto World Boss Solo — 2 giây/lần |
| `5` | Auto Script — chạy rule bạn tự tạo, 3 giây/lần |
| `6` | Vào/ra chế độ thêm rule |
| `= / +` | Tăng tốc độ game (tối đa 10×) |
| `-` | Giảm tốc độ game |

Trong chế độ thêm rule (`6`):

| Phím | Chức năng |
|:---:|---|
| `0` | Lưu **vị trí** — đặt chuột ngay trên nút rồi bấm |
| `9` | Lưu **màu** — **di chuột ra xa trước**, rồi bấm |
| `8` | Xoá rule vừa tạo |

> ⚠️ Phải làm đúng thứ tự: lưu vị trí trước, **di chuột ra xa**, rồi mới lưu màu. Để chuột trên nút sẽ làm nút sáng lên, rule lưu nhầm màu hover và sẽ không bao giờ khớp lúc bình thường.

---

## Tính năng

- **Tăng tốc game tới 10×** — can thiệp đồng hồ và khung hình của game, không phải tua nhanh giả
- **Không chiếm chuột** — gửi sự kiện thẳng vào canvas, con trỏ thật đứng yên
- **Chạy nền được** — game không bị treo khi bạn chuyển sang tab khác
- **Rule tự tạo** — chỉ vào nút nào là bot tự học vị trí + màu nút đó
- **Rule không phụ thuộc độ phân giải** — xem mục dưới
- **Tự tắt** — không click được gì trong 3 phút thì dừng, tránh chạy hoang

### Rule không phụ thuộc độ phân giải

Đây là khác biệt lớn nhất so với bản gốc.

Bản gốc lưu toạ độ pixel trần. Trên macOS canvas bị ghim ở một kích thước tối thiểu nên không sao, **nhưng trên Windows framebuffer thay đổi theo cửa sổ và độ phân giải màn hình** — đổi zoom, kéo cửa sổ, hay chuyển sang màn hình khác DPI là mọi rule lệch hết.

BHB lưu kèm **kích thước framebuffer lúc chụp rule**, nên rule tự quy đổi sang khung hình hiện tại. Đổi cỡ cửa sổ hay zoom vẫn chạy đúng.

Rule nhập từ bản cũ không có thông tin này, nên overlay đánh dấu **⚠ màu cam** — nên bấm `6` chụp lại cho chắc.

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
├── rules/           model rule, rule có sẵn, chụp rule
├── ui/              overlay, help, marker, phím tắt
└── i18n/            tiếng Việt + tiếng Anh
```

---

## Nguồn gốc

Dự án khởi đầu từ [`laviehihi/bh-scripts`](https://github.com/laviehihi/bh-scripts) — cảm ơn tác giả đã tìm ra cách đọc framebuffer, bộ toạ độ/màu nút đã kiểm chứng, và kỹ thuật tăng tốc game. Phần kiến thức đó vẫn là nền tảng của bot này.

Code đã được viết lại hoàn toàn. Chi tiết xem [NOTICE.md](NOTICE.md).

## Lưu ý

Công cụ này dành cho mục đích học tập và dùng cá nhân. Tự động hoá game có thể vi phạm điều khoản dịch vụ của nền tảng hoặc của nhà phát hành — bạn tự chịu trách nhiệm khi sử dụng.
