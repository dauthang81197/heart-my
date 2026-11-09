---
title: 'Nền tảng UI ấm áp, lãng mạn + toast/xác nhận'
type: 'feature'
created: '2026-11-09'
status: 'in-review'
baseline_commit: 'NO_VCS'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Giao diện web hiện là theme tối xám-xanh lạnh, không hợp chủ đề thư tay; lỗi/xác nhận dùng `alert()`/`confirm()` của trình duyệt nên thô và phá trải nghiệm; trạng thái loading chỉ là "…".

**Approach:** Đổi bảng màu/typography toàn cục sang tông ấm lãng mạn (vẫn dark) chỉ bằng CSS token, thêm hệ thống Toast + hộp xác nhận dùng chung thay mọi `alert`/`confirm`, thêm component loading và hoàn thiện hover/focus. Không đổi bố cục từng trang (Editor, ViewLetter, Dashboard để spec sau).

## Boundaries & Constraints

**Always:** Giữ dark theme; mọi màu đi qua biến CSS trong `:root`; giữ nguyên class hiện có để không vỡ trang; chữ tiếng Việt hiển thị đúng với font mới; có `:focus-visible` rõ ràng; tôn trọng `prefers-reduced-motion`.

**Never:** Không thêm thư viện UI/icon/animation; không đổi logic nghiệp vụ, API, route; không thiết kế lại bố cục Editor/ViewLetter/Dashboard; không thêm light mode; không sửa màu trong `design.ts` (màu phong bì/giấy của người dùng).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Toast thành công | `toast('Đã sao chép link')` | Toast hiện góc dưới, tự tắt ~3s | N/A |
| Toast lỗi | `toast(e.message,'error')` | Toast màu lỗi, tự tắt ~5s, bấm để đóng | N/A |
| Nhiều toast | 3 lần gọi liên tiếp | Xếp chồng, không đè nhau | Tối đa 4 hiển thị, cũ nhất bị bỏ |
| Xác nhận | `await confirm({message,danger})` | Modal; trả `true` khi đồng ý, `false` khi huỷ/Esc/bấm nền | N/A |

</frozen-after-approval>

## Code Map

- `web/src/styles.css` -- toàn bộ CSS; token ở dòng 1 (`:root`). Màu cứng cần chuyển sang token: `#1f2328`, `#2a2f35`, `#171a1e`, `#10151a`, `#e8eaed`, `#8aa4b51a`, `.hero-r`, `.logo i`.
- `web/index.html` -- link Google Fonts, `theme-color`; thêm font serif cho tiêu đề (Playfair Display, Dancing Script đã có).
- `web/src/main.tsx` -- chồng provider; thêm `UIProvider` ngoài cùng trong `BrowserRouter`.
- `web/src/App.tsx` -- `Private` hiển thị `…` khi loading → dùng `Spinner`.
- `web/src/components/StampShop.tsx:26,41` -- `alert(e.message)`.
- `web/src/pages/Editor.tsx:116,123` -- `alert`, `confirm('Xoá bản nháp này?')`; dòng 119 `…`.
- `web/src/pages/Dashboard.tsx:44,45` -- `alert('Đã sao chép link')`, `confirm('Xoá thư này?')`.
- `web/src/pages/Admin.tsx:47` -- `confirm` duyệt tay đơn.
- `web/src/pages/SendLetter.tsx`, `ViewLetter.tsx` -- `<div className="center">…</div>` loading.
- Tái dùng: class `.modal-bg`/`.modal`/`.btn`/`.btn.danger` cho hộp xác nhận. KHÔNG đụng `design.ts`, `LetterCanvas`, `Envelope*`.

## Tasks & Acceptance

**Execution:**
- [ ] `web/src/styles.css` -- đổi token sang tông ấm (nền tím-mận/nâu đậm, accent hồng phấn/vàng champagne, chữ kem), thay màu cứng bằng token, thêm `h1,h2,h3` serif, bo góc/bóng mềm, `:focus-visible`, transition hover, `prefers-reduced-motion` -- nền tảng diện mạo
- [ ] `web/index.html` -- cập nhật `theme-color`, đảm bảo font serif dùng được -- đồng bộ màu thanh trình duyệt
- [ ] `web/src/components/UI.tsx` -- tạo `UIProvider`, hook `useUI()` trả `{ toast, confirm }`, component `Spinner` -- thay alert/confirm, loading
- [ ] `web/src/styles.css` -- thêm style `.toasts`, `.toast(.error/.ok)`, `.spinner`, hộp xác nhận (`role="dialog"`, `aria-live` cho toast) -- hỗ trợ UI.tsx
- [ ] `web/src/main.tsx` -- bọc `UIProvider` -- cung cấp context
- [ ] `StampShop.tsx`, `Editor.tsx`, `Dashboard.tsx`, `Admin.tsx` -- thay `alert`→`toast`, `confirm`→`await confirm` -- bỏ hộp thoại trình duyệt
- [ ] `App.tsx`, `Editor.tsx`, `SendLetter.tsx`, `ViewLetter.tsx` -- thay `…` bằng `<Spinner/>` -- loading nhất quán

**Acceptance Criteria:**
- Given mở bất kỳ trang nào, when tải xong, then nền/chữ/nút theo tông ấm mới, không còn mảng xám-xanh cũ, độ tương phản chữ chính ≥ 4.5:1.
- Given grep `alert(` và `confirm(` trong `web/src`, then chỉ còn trong `UI.tsx` nếu có (không còn ở page/component).
- Given xoá nháp/xoá thư/duyệt tay, when bấm, then hiện modal xác nhận; Esc hoặc Huỷ không thực hiện hành động.
- Given điều hướng bàn phím, when Tab, then mọi nút/ô nhập có viền focus nhìn thấy.
- Given `prefers-reduced-motion: reduce`, then animation/transition lớn bị tắt.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

Gợi ý token (có thể tinh chỉnh khi implement, giữ tinh thần): `--bg:#1d1517; --bg2:#2a1d21; --line:#4a343a; --fg:#f6ece4; --mut:#b9a29a; --acc:#e8a0a8; --acc2:#d4a373; --danger:#e5736e; --ok:#7bc79a;`. Nút chính: nền `--acc`, chữ tối `#2a1418`. `useUI()` là Promise-based để thay `confirm()` đồng bộ gọn: `if (await confirm({ message: 'Xoá bản nháp này?', danger: true })) …`.

## Verification

**Commands:**
- `cd web && npm run build` -- expected: `tsc --noEmit` và `vite build` thành công, không lỗi type
- `grep -rnE "\b(alert|confirm)\(" web/src` -- expected: không có kết quả ngoài `UI.tsx`

**Manual checks (if no CLI):**
- `cd web && npm run dev`: xem Landing, Login, Dashboard, Editor, SendLetter, ViewLetter đều đúng tông ấm, không vỡ bố cục ở 375px và desktop; thử xoá nháp (modal xác nhận) và sao chép link (toast).
