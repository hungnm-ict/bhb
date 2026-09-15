# BHB <!--version-->v0.11.0<!--/version-->

> 🇬🇧 [English version](README.en.md) · [Nhật ký thay đổi](https://github.com/hungnm-ict/bhb/commits/master)

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
3. Mở game, bấm phím **`` ` ``** (dấu huyền, dưới phím Esc) để mở bảng điều khiển

> Nếu bấm `` ` `` không hiện gì: gần như chắc chắn là Bước 2 chưa xong. Mở Console (F12) tìm dòng `[BHB] ready` — không có nghĩa là script chưa chạy.

Từ lần sau **script tự cập nhật** — không phải cài lại. Tampermonkey tự kiểm tra bản mới; muốn cập nhật ngay thì vào Tampermonkey → Dashboard → tab **Installed userscripts** → bấm **Check for userscript updates**.

---

## Giao diện

Bot hiện một **thanh nhỏ** ở góc phải trên mặt game: chấm trạng thái, tốc độ, và dòng mô tả bot đang làm gì. Không đụng vào 4 giây thì nó tự mờ đi để khỏi che game; rê chuột vào là rõ lại.

Bấm vào thanh đó (hoặc phím `` ` ``) để mở **bảng điều khiển**, gồm 6 tab:

| Tab | Nội dung |
|---|---|
| **Chạy** | Công tắc Tuỳ chỉnh và Chạy tất cả, thanh trượt tốc độ, cỡ canvas, đếm ngược tự tắt |
| **Bước** | Bảng bước: đổi tên, bật/tắt, gán hoạt động, giới hạn theo màn hình, sắp xếp thứ tự, xoá |
| **Màn hình** | Vùng nhận diện màn hình game, có ✓/✗ và tỉ lệ khớp trực tiếp |
| **Cài đặt** | Hồ sơ (mỗi nhân vật một cái), hàng đợi hoạt động, tự tải lại khi treo, thông báo Discord/Telegram, ngôn ngữ, xuất/nhập |
| **Nhật ký** | Thống kê phiên ở trên, rồi từng việc bot đã làm, mới nhất trên cùng |
| **?** | Bảng tra phím tắt |

Một **bước** là "thấy màu này ở chỗ này (trên màn hình này) thì bấm vào đó", và bot chạy các bước **theo đúng thứ tự trong bảng**: thử bước đang chờ trước, bấm xong thì sang bước kế.

Game thì không chạy theo kịch bản — popup quà ngày, mất kết nối, trận kết thúc ở màn không ai lường. Nên khi bước đang chờ không khớp trong 3 nhịp liền, bot **bỏ chỗ của mình** và lấy bước nào hợp với màn hình trước mặt, rồi đi tiếp từ đó. Nhật ký ghi lại mỗi lần như vậy.

Khi mở tab **Bước**, mỗi bước được vẽ thành một **dấu ngay trên canvas** tại đúng chỗ nó nhìn vào. Rê chuột lên dòng nào thì dấu tương ứng sáng lên và ngược lại — nhìn là biết bước đó trỏ vào nút nào. Bước bot **đang chờ** được đánh dấu ▶, nên một chuỗi bị kẹt là thấy ngay.

### Tạo bước

Bật **chế độ bắt bước** ở đầu tab Bước, rê chuột lên nút trong game rồi bấm phím `X`. Hoặc bấm thẳng nút **Bắt bước tại con trỏ** — nút thì lúc nào cũng dùng được, không cần bật gì.

> Phím `X` mặc định tắt, và nên tắt lại khi bắt xong: nó nằm cạnh các phím điều khiển bot, để bật suốt thì dễ bấm nhầm giữa lúc đang chơi.

Bot tự xử lý chuyện nút bị sáng lên do con trỏ đang nằm trên đó: nó gạt **con trỏ ảo** ra góc canvas, đợi game vẽ lại, đọc màu lúc nút không sáng, rồi trả con trỏ ảo về chỗ cũ. Con trỏ thật của bạn không hề nhúc nhích. Cả hai màu — lúc sáng và lúc thường — đều được lưu, nên bước khớp được ở cả hai trạng thái.

Muốn bot biết nó đang ở đâu thì sang tab **Màn hình**, kéo một khung quanh thứ chỉ màn hình đó mới có. Màn hình "hết vé / hết năng lượng" thì bật thêm `stopsTask` (nút ⏹) — đó là cái làm hàng đợi tự nhảy sang hoạt động khác thay vì đứng bấm mãi. Nút **★** cạnh nó là "báo tin khi thấy màn hình này": xem mục Thông báo bên dưới.

### Phím tắt

| Phím | Chức năng |
|:---:|---|
| `` ` `` | Mở/đóng bảng điều khiển |
| `Esc` | Đóng bảng (lúc bảng đang đóng thì phím này vẫn thuộc về game) |
| `C` | Tuỳ chỉnh — chạy các bước chưa gán hoạt động, 3 giây/lần |
| `A` | Chạy tất cả — lần lượt mọi hoạt động trong hàng đợi (cần có bước đã gán) |
| `X` | Bắt bước tại con trỏ (phải bật chế độ bắt bước trước) |
| `= / +` | Tăng tốc độ game (mốc kế tiếp, tối đa 20×) — hoặc bấm nút + cạnh thanh trượt |
| `-` | Giảm tốc độ game (chậm nhất 0.1×) |
| `0` | Về tốc độ thường (1×) |

---

## Tính năng

- **Chỉnh tốc độ game 0.1× – 20×** — can thiệp đồng hồ và khung hình của game, không phải tua nhanh giả
- **Không chiếm chuột** — gửi sự kiện thẳng vào canvas, con trỏ thật đứng yên
- **Chạy nền được** — game không bị treo khi bạn chuyển sang tab khác
- **Bước tự bắt** — chỉ vào nút nào là bot tự học vị trí + màu nút đó
- **Chạy đúng thứ tự, và tự bò dậy** — bot đi theo thứ tự bước; lạc thì bắt lại từ bước hợp với màn hình đang thấy
- **So khớp cả vùng** — thay vì 1 pixel, bot đọc cả một khung và chấm 16 điểm mẫu, nên một hiệu ứng lướt qua không làm bước sai
- **Biết đang ở màn hình nào** — bước chỉ chạy ở màn hình bạn cho phép, và màn hình "hết vé" sẽ tự chuyển sang hoạt động khác
- **Chạy tất cả** — hàng đợi hoạt động chạy từ trên xuống, hết tài nguyên thì sang mục kế, hết một vòng thì quay lại từ đầu
- **Bước không phụ thuộc độ phân giải** — xem mục dưới
- **Nhiều hồ sơ** — mỗi nhân vật một bộ bước + màn hình + hàng đợi, xuất/nhập được
- **Tự tải lại khi game treo** — bật trong Cài đặt; không bật thì bot chỉ dừng sau 3 phút không làm gì
- **Chạy tiếp khi cửa sổ bị che kín** — xem mục dưới
- **Cỡ canvas ở góc màn hình** — tự mờ đi, sáng lại khi rê chuột tới gần, và không chặn click xuống game
- **Thống kê phiên** — đầu tab Nhật ký, sống qua cả những lần watchdog tải lại trang
- **Thông báo Discord / Telegram** — kèm ảnh chụp game, xem mục dưới

### Bước không phụ thuộc độ phân giải

Đây là khác biệt lớn nhất so với bản gốc.

Bản gốc lưu toạ độ pixel trần. Trên macOS canvas bị ghim ở một kích thước tối thiểu nên không sao, **nhưng trên Windows framebuffer thay đổi theo cửa sổ và độ phân giải màn hình** — đổi zoom, kéo cửa sổ, hay chuyển sang màn hình khác DPI là mọi toạ độ lệch hết.

BHB lưu kèm **kích thước framebuffer lúc bắt bước**, nên bước tự quy đổi sang khung hình hiện tại. Đổi cỡ cửa sổ hay zoom vẫn chạy đúng.

Bước nhập từ bản cũ không có thông tin này nên **không quy đổi được** — tab Bước đếm và cảnh báo chúng, và cạnh toạ độ có dấu **⚠ cam**. Bắt lại bằng phím `X` là hết.

### Cửa sổ bị che kín thì game đứng

Chrome và Edge coi một cửa sổ **bị cửa sổ khác phủ kín hoàn toàn** là đang ẩn, và ngừng vẽ nó. `requestAnimationFrame` do bộ vẽ điều khiển nên ngừng bắn theo, và vòng lặp của game chết đứng. Che một phần thì không sao — đó là lý do bạn bấm sang app khác mà game vẫn chạy, chỉ maximize mới đứng.

Không có cách nào nói dối để trình duyệt bắn lại rAF: quyết định đó nằm dưới tầng JavaScript. Nên BHB **tự lái vòng lặp**: nó vốn đã chặn `requestAnimationFrame` cho phần tăng tốc, nên đang giữ callback của game — khi 250ms không có frame thật nào tới, nó tự gọi callback đó.

Nhịp gọi lấy từ **luồng âm thanh** (một `ScriptProcessorNode` im lặng), vì `setInterval` bị bóp còn 1 lần/giây đúng trong tình huống này, còn luồng âm thanh thì không. Trình duyệt chỉ cho âm thanh chạy sau khi bạn bấm gì đó trong trang, nên bấm một phím bất kỳ sau khi mở game là xong.

Tắt được trong Cài đặt nếu không cần.

### Thống kê phiên

Đầu tab **Nhật ký** là sáu con số của phiên: thời gian chạy, lượt click, vòng hàng đợi, tin đã báo, số lần lạc nhịp, số lần game treo phải tải lại. Dưới đó là bảng theo từng hoạt động — mỗi dòng cho biết hoạt động đó đã click bao nhiêu, được ghé bao nhiêu lượt, và cạn tài nguyên mấy lần.

Số liệu **không reset khi watchdog tải lại trang**. Đó là chủ ý: cày qua đêm mà mỗi lần game treo lại đếm từ đầu thì sáng ra chẳng đọc được gì. Chỉ nút **Đặt lại** mới xoá, và nó cũng đặt lại mốc thời gian phiên.

### Thông báo đồ rơi hiếm

Không có cơ chế thị giác riêng cho "đồ hiếm" — nó dùng lại **màn hình**. Bắt vùng popup đồ rơi (hoặc familiar legendary) thành một màn hình như bình thường, rồi bấm **★** trên dòng đó. Từ lúc ấy, mỗi lần popup xuất hiện là một tin — đúng một tin, không phải mỗi nhịp một tin, vì nó chỉ báo lúc màn hình *đổi* sang.

Kênh gửi cấu hình ở tab **Cài đặt** → **Thông báo**:

- **Discord**: dán webhook URL của kênh (Server Settings → Integrations → Webhooks).
- **Telegram**: cần cả **bot token** (từ [@BotFather](https://t.me/BotFather)) và **chat ID**. Nhắn cho bot một câu rồi mở `https://api.telegram.org/bot<TOKEN>/getUpdates` là thấy chat ID.

Có cả hai thì gửi cả hai. Ngoài tin đồ rơi, bật thêm được: hết tài nguyên, game treo phải tải lại, bật/tắt hoạt động. Mỗi loại tin tối đa **1 lần/phút** để một màn hình chớp tắt không làm ngập kênh.

Nút **Gửi thử** có mặt vì webhook gõ sai thì hỏng lặng lẽ ngoài mạng — không có nó, thứ đầu tiên bạn biết sẽ là cái tin đáng lẽ phải đến đêm qua mà không đến.

Ảnh chụp lấy thẳng từ canvas game (bot vốn đã ép `preserveDrawingBuffer`), tắt được nếu chỉ muốn chữ.

### Nhiều nhân vật, nhiều tài khoản

Mỗi **hồ sơ** trong tab Cài đặt giữ bước, màn hình và hàng đợi riêng — mỗi nhân vật một hồ sơ, đổi bằng dropdown. Việc bấm đổi nhân vật *trong game* thì vẫn phải bắt bước như mọi thao tác khác.

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

Sửa code trong `src/`, chạy `npm run build`, rồi reload trang game. Muốn phát hành bản mới: tăng `version` trong `package.json`, build, commit, push — `npm run build` tự đóng dấu số phiên bản vào `@version` của userscript và vào tiêu đề README này.

Đánh số: xong một milestone trong [ROADMAP](docs/ROADMAP.md) thì tăng minor (`0.5.0` → `0.6.0`), sửa vặt thì tăng patch. `1.0.0` là khi đủ hoàn thiện để chia sẻ rộng.

> ⚠️ Tampermonkey **không bao giờ tự cập nhật xuống** số phiên bản thấp hơn. Nếu từng cài bản 2.x cũ thì phải gỡ và cài lại một lần.

### Cấu trúc

```
src/
├── main.js          điểm vào — thứ tự khởi tạo nằm ở đây
├── core/
│   ├── canvas.js    tìm canvas, ép preserveDrawingBuffer
│   ├── coords.js    quy đổi toạ độ — chỗ xử lý vấn đề độ phân giải
│   ├── pixel.js     đọc 1 pixel từ WebGL
│   ├── region.js    đọc cả vùng và chấm 16 điểm mẫu
│   ├── color.js     so màu
│   ├── input.js     dispatch click giả
│   ├── focus.js     nói dối về visibility để game không tự ngủ
│   ├── speed.js     tăng tốc game + tự lái frame khi cửa sổ bị che
│   ├── keepalive.js nhịp lấy từ luồng âm thanh, không bị trình duyệt bóp
│   ├── watchdog.js  ghi nhớ task để chạy tiếp sau khi tải lại trang
│   ├── timers.js    giữ timer gốc trước khi speed hack thay chúng
│   ├── engine.js    vòng lặp tự động: con trỏ bước, hàng đợi, tự tắt
│   └── storage.js   hồ sơ + cài đặt (schema v5)
├── bot/
│   ├── step.js      model bước
│   ├── step-editor.js   bắt / sửa / sắp xếp bước
│   ├── screen.js        nhận diện màn hình
│   ├── screen-editor.js bắt vùng nhận diện
│   ├── activity.js      hàng đợi hoạt động
│   └── builtin.js       bước có sẵn cho re-run và solo WB
├── ui/              HUD, bảng điều khiển, dấu trên canvas, badge cỡ canvas
└── i18n/            tiếng Việt + tiếng Anh
```

Test nằm ở `tests/`, chạy bằng vitest. Phần nào dễ làm mất công sức của người dùng — quy đổi toạ độ, migrate storage, con trỏ bước — đều có test cắm cứng.

---

## Nguồn gốc

Dự án khởi đầu từ [`laviehihi/bh-scripts`](https://github.com/laviehihi/bh-scripts) — cảm ơn tác giả đã tìm ra cách đọc framebuffer, bộ toạ độ/màu nút đã kiểm chứng, và kỹ thuật tăng tốc game. Phần kiến thức đó vẫn là nền tảng của bot này.

Code đã được viết lại hoàn toàn. Chi tiết xem [NOTICE.md](NOTICE.md).

## Lưu ý

Công cụ này dành cho mục đích học tập và dùng cá nhân. Tự động hoá game có thể vi phạm điều khoản dịch vụ của nền tảng hoặc của nhà phát hành — bạn tự chịu trách nhiệm khi sử dụng.
