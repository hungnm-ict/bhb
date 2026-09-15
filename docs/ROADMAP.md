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
- [x] Thứ tự mặc định: PVP → GVG → Invasion → Expedition → TG → WB → Raid → Dungeon

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

## English summary

Milestone 1 (foundations) is done. Milestone 2 adds region matching and screen-state
detection — the reliability layer everything else needs. Milestone 3 is **auto-regen**:
per-activity runners plus a reorderable priority queue (PVP → GVG → Invasion →
Expedition → Trials/Gauntlet → World Boss → Raid → Dungeon) looping until resources
run out. Milestone 4 covers lag detection with auto-restart and character-slot
switching. Milestone 5 adds session stats that survive a watchdog reload, and
Discord/Telegram alerts with a canvas screenshot — a rare drop is just a screen
with its `notify` flag set, so it needs no vision code of its own.
