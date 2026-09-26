# Roadmap

> 🇬🇧 English summary at the bottom.

Mỗi milestone là một lớp; lớp sau dựa trên lớp trước.

**Đánh số bản:** xong một milestone thì tăng minor (`0.2.0` → `0.3.0`), sửa vặt
và tính năng nhỏ thì tăng patch. `1.0.0` là khi đủ hoàn thiện để share rộng.

---

## ✅ Milestone 1 — Nền tảng *(xong)*

- [x] Repo riêng, `@require` trỏ về repo mình, auto-update qua `@updateURL`
- [x] Refactor sang ES modules + build esbuild ra 1 file
- [x] **Toạ độ chuẩn hoá** — rule không vỡ khi đổi cỡ cửa sổ / zoom / DPI
- [x] Profile rule có tên + export/import JSON
- [x] i18n Việt + Anh
- [x] Unit test + smoke test bundle

**Còn nợ:** điền `BUILTIN_CAPTURE_BUFFER` (cần số liệu probe từ máy Windows), port WB Team từ `reference/upstream/wb-party.js`.

---

## ✅ Milestone 2 — Thị giác & trạng thái *(xong)*

Nền cho mọi thứ phía sau. Dò 1 pixel quá mong manh cho chuỗi hành động dài.

- [x] **Region matching** — đọc cả vùng và so khớp 16 điểm mẫu, thay vì 1 pixel
- [x] **Nhận biết màn hình** — tab Màn hình: kéo khung để bắt vùng nhận diện, có ✓/✗ và tỉ lệ khớp trực tiếp
- [x] Máy trạng thái: mỗi rule khai báo màn hình được phép chạy; rule cũ không khai báo thì chạy ở mọi nơi
- [x] Nhận biết **hết tài nguyên** — màn hình bật `stopsTask` sẽ dừng hoạt động và ghi nhật ký

**Còn nợ:** đồ thị chuyển màn (A + hành động → B, kèm phục hồi) — chỉ rõ được khi có runner ở Milestone 3.

---

## ✅ Milestone 3 — Auto-regen (Run-All) *(khung xong, chờ rule thật)*

Tự động chạy hết các hoạt động mình chọn, theo thứ tự mình đặt.

- [x] Runner từng hoạt động: mỗi rule gắn thẻ hoạt động, hàng đợi chỉ chạy rule của hoạt động hiện tại
- [x] **Hàng đợi ưu tiên** — tab Chạy tất cả: bật/tắt và ▲▼ sắp xếp
- [x] Lặp vô hạn: hết tài nguyên thì sang mục kế, hết một vòng thì quay lại từ đầu, mọi mục cạn trong cùng một vòng thì dừng
- [x] Tuỳ chọn: chạy xong một vòng thì đóng game (mặc định tắt)
- [x] Thứ tự mặc định: WB solo → WB team → Dungeon → Raid → PVP → TG → Invasion → Expedition → GVG

**Còn nợ:** rule thật cho từng hoạt động — phải bắt trực tiếp trên game, không viết sẵn được.

*Tham khảo: nhánh `upstream/feature-afk` có `afk/pvp.js`, `raid.js`, `tg.js`, `wb.js`.*

---

## ✅ Milestone 4 — Ổn định & nhân vật *(xong)*

- [x] **Phát hiện lag/treo** — quá 3 phút không click được gì thì tải lại trang, đợi game vào lại rồi chạy tiếp; tối đa 3 lần liên tiếp rồi dừng
- [x] **Đổi nhân vật** — hồ sơ trong tab Cài đặt: tạo / nhân bản / đổi tên / xoá / chuyển, mỗi hồ sơ một bộ rule + màn hình + hàng đợi
- [x] Chạy nhiều tài khoản bằng nhiều browser profile — mỗi browser profile là một `localStorage` riêng, không cần code

**Còn nợ:** rule bấm đổi nhân vật trong game — phải bắt trực tiếp như mọi thao tác khác.

---

## ✅ Milestone 5 — Thống kê & thông báo *(xong)*

- [x] **Thống kê phiên** — thời gian chạy, lượt click, vòng hàng đợi, lần lạc
      nhịp, lần treo phải tải lại, và bảng theo từng hoạt động (click / lượt /
      cạn). Nằm đầu tab Nhật ký, có nút đặt lại
- [x] Số liệu **sống qua lần tải lại của watchdog** — một đêm cày không bị chia
      vụn mỗi lần game treo
- [x] Bảng hoạt động cuộn, mới nhất trên cùng *(đã có từ Milestone 3)*
- [x] **Phát hiện đồ rơi hiếm** — không phải cơ chế riêng: bật cờ `notify` cho
      một *màn hình*, y như `stopsTask`. Bắt khung popup đồ rơi thành màn hình
      rồi tick ★ là xong; đúng một tin mỗi lần popup xuất hiện
- [x] **Thông báo Discord / Telegram kèm ảnh chụp canvas** — `fetch` thẳng (script
      vẫn `@grant none`), chọn loại tin muốn nhận, nút Gửi thử, mỗi loại tối đa
      1 tin/phút

**Còn nợ:** thắng/thua PVP và cá câu được — hai con số đó phải đọc từ màn hình
kết quả, nên chúng là màn hình cần bắt trực tiếp trên game, không viết sẵn được.

---

## Milestone 6 — Bước có điều kiện *(xong)*

Hai chế độ cứng `Re-run` và `Solo WB` đã bị xoá: toạ độ viết sẵn trong mã nguồn
chỉ đúng trên máy đã bắt chúng, và màu thì không quy đổi được theo cỡ canvas.

- [x] **Chạy riêng một hoạt động** — nút ▶ ở mỗi dòng hàng đợi; "Solo WB" nay là
      "chạy riêng World Boss" trên bước do người dùng bắt
- [x] **Nghỉ N giây sau khi bấm** — tuỳ chọn của từng bước, thay cho pha nghỉ
      cứng của Re-run; dùng cho nút mở trận Dungeon/Raid
- [x] **Khoá cỡ canvas 640×400** — cùng một cỡ thì cùng một ảnh, điều kiện cần
      để chia sẻ bộ bước
- [x] **Bước "Bấm nếu có"** — không thấy thì bỏ qua, không đứng đợi. Dùng cho ô
      đã tick sẵn như Private
- [x] **Bước "Chờ đến khi hết"** — còn thấy màu là còn đứng chờ. Đây là cách nói
      "chờ đủ người rồi mới bấm START" bằng ngôn ngữ màu: nút INVITE của ô trống
      chính là màu cần chờ cho mất đi
- [x] **World Boss tách solo / team** — hai chuỗi khác nhau, không phải một chuỗi
      kèm tuỳ chọn

- [x] **Bước "Đếm đổi"** — khoanh một ô, đợi nó đổi nội dung N lần rồi mới đi
      tiếp. Invasion không bao giờ thắng được, chỉ cần giết 21 quái là đủ
      thưởng, nên chuỗi của nó là: vào trận, đếm 7 wave, tắt auto, bấm ✕, thoát,
      chạy lại. Ô số wave đổi mỗi wave, và bot không cần đọc được con số —
      đổi là đổi, ở mức nào cũng thế

**Còn nợ:** bước thật cho từng hoạt động — vẫn phải bắt trực tiếp trên game.

---

## Milestone 7 — Giờ lag của server *(xong)*

Server game đuối vào những khung giờ cố định hằng ngày, và bot không đo được
điều đó: canvas vẫn vẽ sáu mươi khung hình một giây trong khi request phía sau
treo. Thứ duy nhất nó biết được là do được bảo.

- [x] **Khung giờ lag, lặp hằng ngày** — điền sẵn ba khung của game này, sửa
      thêm bớt được, theo giờ máy người dùng
- [x] **Trong khung thì hạ tốc độ về 1x** — bắt trình duyệt vẽ mười lăm khung
      hình cho mỗi khung thật vào đúng giờ server đang đuối là cách biến một giờ
      chậm thành một giờ chết, mà boost lúc đó cũng không đẩy nhanh được gì
- [x] **Trả lại tốc độ cũ khi hết khung**, trừ khi người dùng tự chỉnh trong lúc
      đó — tay họ thắng trí nhớ của bot

---

## Milestone 8 — Cày qua đêm không cần người *(chưa làm)*

Ba thứ còn thiếu để một đêm chạy được từ đầu tới sáng mà không ai ngồi canh.
Cả ba đều lộ ra khi dựng chuỗi Dungeon và Invasion thật, không phải nghĩ ra.

- [ ] **Cạn hết thì ngủ, đừng chết** — đi hết một vòng mà mọi hoạt động đều cạn
      thì bot đang **dừng hẳn**, ghi `everything is spent`. Đúng cho vài tiếng,
      sai cho cả đêm: năng lượng hồi sau một lúc mà bot đã tắt từ lâu. Phải là
      nghỉ một khoảng rồi thử lại vòng nữa, cạn tiếp thì ngủ tiếp

- [ ] **Khoá phủ định trên bước** — hiện chỉ nói được *"chỉ bắn khi đang ở màn
      hình X"*. Không nói được *"bắn khi KHÔNG ở X"*. Nên "bấm ▶ cho tới khi tới
      đúng zone" phải dựng bằng một màn hình cho mỗi zone rồi gắn một bước ▶ cho
      từng cái — tám tier là tám màn hình. Có khoá phủ định thì còn hai bước

- [ ] **Phát hiện lag bằng FPS** — đỉnh FPS trong ba phút rơi vào khoảng 1–20 là
      lag, bằng 0 là treo (hai thứ này chữa khác nhau). Chắc chắn lag thì hạ tốc
      độ về 1 rồi tải lại game và chạy tiếp chế độ cũ. Khung giờ server (M7) đã
      bắt được phần lag theo lịch; cái này bắt phần còn lại

**Vì sao cả ba nằm cùng một chỗ:** không cái nào tự nó đáng một bản phát hành,
và cả ba cùng trả lời đúng một câu hỏi — bấm Run lúc đi ngủ thì sáng dậy nó còn
đang chạy chứ?

---

## Milestone 7 — Cập nhật không phải bấm *(chưa làm)*

**Vấn đề:** Tampermonkey giữ khoảng cách tối thiểu giữa hai lần kiểm tra, và
bước xác nhận cài là bắt buộc — nên vừa phát hành xong thì phải mở tab cài rồi
tải lại trang. v0.13.0 đã bớt một nửa phiền phức (đọc thẳng bản phát hành, có
nút cài và nút tải lại), nhưng vẫn còn hai cú bấm.

**Không làm được:** tự cài từ trong trang. Userscript chạy ở ngữ cảnh trang thì
không ghi được vào kho script của Tampermonkey — ranh giới bảo mật có chủ ý, vì
nếu không thì trang web nào cũng cài được userscript. `@grant GM_*` cũng không
có API tự cập nhật, chỉ có `GM_info` để đọc phiên bản.

**Hướng khả dĩ — "script mồi":** thứ cài vào Tampermonkey chỉ là đoạn nạp nhỏ;
mỗi lần mở game nó tải mã bot mới nhất từ GitHub rồi chạy. Cập nhật tức thì,
không bao giờ phải cài lại.

Cái giá, và là lý do chưa làm:

- [ ] **Mất quyền xem trước thứ mình chạy** — bản dựng hiện cố tình không nén để
      người cài đọc được. Script mồi biến nó thành "chạy bất cứ thứ gì đang nằm
      trên GitHub lúc đó", kể cả một bản đẩy nhầm
- [ ] **Mất mạng là không nạp được** — cần đệm bản đã tải trong `localStorage`
      để offline vẫn chạy
- [ ] **CSP trang game có thể chặn** nạp mã từ ngoài — phải thử mới biết
- [ ] Ghim theo phiên bản, để không tự nhảy sang bản chưa được duyệt

**Giải pháp tạm thời, không tốn dòng mã nào:** Tampermonkey → Settings (chế độ
`Advanced`) → **Script Update** → đặt **Check interval** dày nhất. Bản mới về tự
động, tải lại trang game là xong.

---

## English summary

Milestone 1 (foundations) is done. Milestone 2 adds region matching and screen-state
detection — the reliability layer everything else needs. Milestone 3 is **auto-regen**:
per-activity runners plus a reorderable priority queue (World Boss solo and team →
Dungeon → Raid → PVP → Trials/Gauntlet → Invasion → Expedition → GVG) looping until
resources run out. Milestone 4 covers lag detection with auto-restart and character-slot
switching. Milestone 5 adds session stats that survive a watchdog reload, and
Discord/Telegram alerts with a canvas screenshot — a rare drop is just a screen
with its `notify` flag set, so it needs no vision code of its own. Milestone 6
replaced the hard-coded modes with conditional steps: wait until a colour is
gone, click one only if it is there, run any activity on its own. Milestone 7 is
unbuilt — updating without the install tab, which needs a loader that would cost
the reader the ability to see what they are about to run.
