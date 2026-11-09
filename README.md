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

## Deploy (VPS Linux + GitHub Actions)
1. VPS: cài Docker + compose, tạo thư mục, đặt file `.env` (theo `.env.example`) trong thư mục đó.
2. GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PATH`.
3. Push lên `main` → build, scp, `docker compose up -d --build` (migrate + seed tự chạy khi api khởi động).
4. HTTPS: Caddy đã có trong compose. Khi có domain, trỏ DNS A về IP VPS, đặt `SITE_ADDRESS=domain` và `WEB_URL=https://domain` trong `.env` rồi chạy lại `docker compose up -d`; Caddy tự cấp chứng chỉ. Mở cổng 80/443.
   Chưa có domain: giữ `SITE_ADDRESS=:80` (HTTP theo IP).

## SePay (VietQR tự xác nhận)
Webhook URL: `https://<domain>/api/orders/webhook/sepay`, kiểu xác thực API Key = `SEPAY_API_KEY`. Nội dung CK chứa mã đơn `HPxxxxxxxx`.
