# HeartPost — Checklist cài đặt & việc còn lại

Tick `[x]` khi xong. Domain: `truenote.online` · VPS thư mục: `~/heartpost` · Caddy publish cổng host `8088` (Nginx Proxy Manager trỏ vào đó).

## 1. GitHub Secrets (repo → Settings → Secrets and variables → Actions)
- [ ] `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (token quyền Read & Write)
- [ ] `GOOGLE_CLIENT_ID` (nhúng vào web lúc build; đổi giá trị thì phải build lại)
- [ ] `VPS_HOST`, `VPS_USER` (`root`), `VPS_SSH_KEY` (private key không passphrase), `VPS_PATH` (vd `/root/heartpost`)

## 2. File `.env` trên VPS (`~/heartpost/.env`, sau khi sửa chạy `docker compose up -d`)
Theo `.env.example`. Những mục **bắt buộc đúng** trước khi mở cho người dùng:
- [ ] `DB_PASSWORD` mạnh · `JWT_SECRET` ngẫu nhiên dài (`openssl rand -hex 32`; đổi sẽ đăng xuất mọi người)
- [ ] `ALLOW_MOCK_PAY=false`
- [ ] `WEB_URL=https://truenote.online` · `SITE_ADDRESS=:80` · `HTTP_PORT=8088` · `HTTPS_PORT=8443`
- [ ] `GOOGLE_CLIENT_ID` (trùng secret GitHub)
- [ ] `ADMIN_EMAILS=email-admin` (admin phải **đăng nhập Google ít nhất 1 lần** mới có quyền)
- [ ] Thanh toán: `BANK_BIN`, `BANK_ACCOUNT`, `BANK_ACCOUNT_NAME`, `SEPAY_API_KEY`
- [ ] **SMTP** (không có thì không gửi được email thông báo thư, mã mở thư, xác minh email, quên mật khẩu): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `SUPPORT_EMAIL`
- [ ] R2 (ảnh/âm thanh): `R2_ACCOUNT_ID` (**chỉ 32 ký tự ID**, không có `https://`), `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=heartpost`, `R2_PUBLIC_URL` (không có `/` cuối)
- [ ] Sao lưu: `R2_BACKUP_BUCKET=heartpost-backups`, `BACKUP_PASSPHRASE` (cất bản sao **ngoài VPS**), `BACKUP_RETENTION_DAYS=14`

## 3. Cloudflare R2
- [ ] Bucket `heartpost`: bật **Public Development URL** (hoặc gắn domain riêng, vd `files.truenote.online`) → dán vào `R2_PUBLIC_URL`
- [ ] Bucket `heartpost`: **CORS policy** (cần cho đổi màu chữ viết tay)
  ```json
  [{ "AllowedOrigins": ["https://truenote.online", "http://localhost:5173"], "AllowedMethods": ["GET", "HEAD"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
  ```
- [ ] Tạo bucket **riêng tư** `heartpost-backups` (**không** bật public)
- [ ] API token R2 có quyền Object Read & Write cho **cả hai** bucket

## 4. Nginx Proxy Manager
- [ ] Proxy Host `truenote.online` → `http` → IP VPS (hoặc `172.17.0.1`) cổng `8088`, bật Websockets + Block Common Exploits
- [ ] SSL: xin chứng chỉ Let's Encrypt, bật Force SSL + HTTP/2
- [ ] Advanced: `client_max_body_size 10m;` (ảnh chữ viết tay đã xử lý ~1,4MB; mặc định nginx chỉ 1MB → lỗi 413)
- [ ] Thử tải ảnh >1MB qua `https://truenote.online` để chắc chắn

## 5. Google Cloud Console (OAuth Client)
- [ ] Authorized JavaScript origins: `https://truenote.online` (+ `http://localhost:5173` để dev)

## 6. SePay (thanh toán VietQR)
- [ ] Webhook URL: `https://truenote.online/api/orders/webhook/sepay`
- [ ] Xác thực: API Key → header `Authorization: Apikey <SEPAY_API_KEY>`
- [ ] Nội dung chuyển khoản phải chứa mã đơn `HPxxxxxxxx`
- [ ] Thử mua 1 tem thật (số tiền nhỏ) để chắc chắn webhook cộng tem

## 7. Giám sát
- [ ] UptimeRobot / Better Stack: monitor `https://truenote.online/api/health` (mong đợi `{"ok":true}`) mỗi 5 phút
- [ ] (Tuỳ chọn) Sentry cho lỗi API/web — chưa tích hợp

## 8. Nội dung pháp lý
- [ ] Đổi email liên hệ trong `web/src/pages/Legal.tsx` (đang là `hello@heartpost.local`)
- [ ] Nhờ người có chuyên môn rà soát **Điều khoản** và **Chính sách riêng tư** (đang là bản mẫu); xác nhận chính sách "tem không hoàn tiền"

## 9. Kiểm tra sau mỗi lần deploy
```bash
cd ~/heartpost
docker compose ps                          # api (healthy), web, caddy, db, backup đều Up
docker compose logs api --tail 40          # không có dòng ERROR ở mục "Env" (JWT_SECRET yếu, MOCK_PAY...)
docker compose logs backup --tail 20       # phải có dòng "OK db/hp-....sql.gz"
curl -s http://127.0.0.1:8088/api/health   # {"ok":true}
```
- [ ] Đăng nhập Google OK · đăng ký email + mật khẩu OK
- [ ] Soạn thư, tải ảnh + ghi âm, đổi màu chữ viết tay
- [ ] Gửi thư riêng tư cho chính mình: nhận email → mở link → xác minh (Google / mã 6 số) → xem thư, ảnh, ghi âm
- [ ] Mua tem + webhook SePay cộng tem
- [ ] Báo cáo thư công khai → admin thấy trong Quản trị → Báo cáo vi phạm
- [ ] **Thử khôi phục backup** vào DB mới (vài tháng/lần):
  `docker compose run --rm --entrypoint restore.sh backup latest heartpost_restore`

## 10. Việc còn có thể làm thêm
- [ ] Sentry/giám sát lỗi · [ ] gắn domain riêng cho bucket ảnh (thay `r2.dev`, bị giới hạn lưu lượng)
- [ ] Sao lưu cả bucket ảnh/âm thanh · [ ] Thu hồi/đăng xuất mọi thiết bị trong Cài đặt
- [ ] Tối ưu gói three.js (~496KB) hoặc phiên bản 2D cho điện thoại yếu
- [ ] Đổi tên miền/email người gửi thư (SPF, DKIM, DMARC) để email không vào thư rác

## Ghi chú vận hành nhanh
- Dev local: `cd api && npm run start:dev` · `cd web && npm run dev` (API cổng khác: `API_URL=http://localhost:3999 npm run dev`)
- Test API: `cd api && npm test` (chạy cả trong CI)
- Migration chạy tự động khi api khởi động (`prisma migrate deploy`); seed chỉ tạo tem mới, không ghi đè giá admin đã sửa
- Rollback: `IMAGE_TAG=<sha cũ> DOCKERHUB_USERNAME=<user> docker compose up -d`
