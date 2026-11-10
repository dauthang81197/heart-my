# HeartPost

React (Vite) + NestJS + PostgreSQL (Prisma). Đăng nhập Google / email-mật khẩu, kho thư, tem thư (mua qua VietQR + webhook SePay), trình soạn thư Konva, gửi riêng tư / công khai / hẹn giờ.

## Chạy local
```bash
docker run -d --name hp-db -e POSTGRES_PASSWORD=pw -e POSTGRES_DB=heartpost -p 5432:5432 postgres:16-alpine
cd api && cp ../.env.example .env   # sửa DATABASE_URL=postgresql://postgres:pw@localhost:5432/heartpost, JWT_SECRET, ALLOW_MOCK_PAY=true
npm i && npx prisma migrate deploy && npm run seed && npm run start:dev
cd ../web && echo VITE_GOOGLE_CLIENT_ID=... > .env && npm i && npm run dev   # http://localhost:5173
```
Dev: nút "[DEV] Giả lập đã thanh toán" trong màn VietQR (cần ALLOW_MOCK_PAY=true).

## Deploy (VPS Linux + GitHub Actions + Docker Hub)
Luồng: push `main` → CI build/test → build & push image `heartpost-api`, `heartpost-web` lên Docker Hub (tag `latest` + SHA commit) → SSH vào VPS, `docker compose pull` rồi `up -d`.
1. VPS: cài Docker + compose, tạo thư mục (= `VPS_PATH`), đặt file `.env` (theo `.env.example`) trong thư mục đó.
2. Docker Hub: tạo Access Token (Account Settings → Security) quyền Read & Write.
3. GitHub Secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `GOOGLE_CLIENT_ID` (nhúng vào web lúc build), `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PATH`.
4. Push lên `main` (hoặc chạy tay: Actions → CI/CD → Run workflow). Migrate + seed tự chạy khi api khởi động.
5. HTTPS: Caddy đã có trong compose. Khi có domain, trỏ DNS A về IP VPS, đặt `SITE_ADDRESS=domain` và `WEB_URL=https://domain` trong `.env` rồi chạy lại `docker compose up -d`; Caddy tự cấp chứng chỉ. Mở cổng 80/443.
   Chưa có domain: giữ `SITE_ADDRESS=:80` (HTTP theo IP).
Rollback: trên VPS `IMAGE_TAG=<sha cũ> DOCKERHUB_USERNAME=<user> docker compose up -d`. Image build cho `linux/amd64`.
Build local không cần Docker Hub: `docker compose up -d --build`.

## SePay (VietQR tự xác nhận)
Webhook URL: `https://<domain>/api/orders/webhook/sepay`, kiểu xác thực API Key = `SEPAY_API_KEY`. Nội dung CK chứa mã đơn `HPxxxxxxxx`.

## Vận hành
- **Giám sát uptime:** tạo monitor (UptimeRobot, Better Stack...) gọi `https://<domain>/api/health` mỗi 5 phút, mong đợi `{"ok":true}`. Endpoint này kiểm tra cả kết nối database.
- **Báo cáo vi phạm:** thư công khai bị báo cáo bởi `REPORT_AUTO_HIDE` người khác nhau (mặc định 3) sẽ tự ẩn chờ admin xem tại trang Quản trị → Báo cáo vi phạm.
- **Email (SMTP):** cần cấu hình `SMTP_*` để gửi thư thông báo, xác minh email và quên mật khẩu. Chưa cấu hình thì các email này chỉ được ghi cảnh báo vào log.
- **Test:** `cd api && npm test` (chạy cả trong CI trước khi build image).
- **Nội dung pháp lý:** chỉnh email liên hệ trong `web/src/pages/Legal.tsx` và nhờ người có chuyên môn rà soát Điều khoản/Chính sách trước khi mở rộng.
