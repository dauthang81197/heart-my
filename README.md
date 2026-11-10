# TrueNote

> 📋 Việc cần cài đặt / cấu hình và checklist kiểm tra: xem [docs/SETUP-CHECKLIST.md](docs/SETUP-CHECKLIST.md)

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

## Sao lưu & khôi phục database
Container `backup` chạy `pg_dump` mỗi đêm (mặc định 2h sáng, giờ VN), nén gzip, (tuỳ chọn) mã hoá AES-256 rồi đẩy lên bucket R2 **riêng tư** `R2_BACKUP_BUCKET`, giữ `BACKUP_RETENTION_DAYS` ngày. Khi container khởi động nó chạy thử 1 lần để phát hiện sai cấu hình sớm.

Thiết lập một lần:
1. Cloudflare → R2 → **Create bucket** `heartpost-backups` — **không bật Public access**.
2. API token R2 đang dùng phải được cấp quyền **Object Read & Write** cho cả bucket này (Manage API tokens → sửa token → thêm bucket).
3. Thêm vào `.env` trên VPS: `R2_BACKUP_BUCKET`, `BACKUP_PASSPHRASE` (khuyến nghị; **cất passphrase ở nơi an toàn khác VPS**), rồi `docker compose up -d`.
4. Kiểm tra: `docker compose logs backup --tail 20` phải thấy dòng `OK db/hp-….sql.gz`.

Lệnh hữu ích (trong thư mục triển khai trên VPS):
```bash
docker compose exec backup backup.sh once     # sao lưu ngay
docker compose exec backup backup.sh list     # liệt kê các bản
# Khôi phục bản mới nhất vào database MỚI để kiểm tra (không đụng dữ liệu đang chạy):
docker compose run --rm --entrypoint restore.sh backup latest heartpost_restore
```
Khôi phục thật sau sự cố: dừng api (`docker compose stop api`), khôi phục vào database trống `heartpost`, rồi `docker compose up -d`. **Hãy thử khôi phục định kỳ** (vài tháng/lần) để chắc chắn bản sao lưu dùng được. Ảnh/âm thanh nằm sẵn trên R2 nên không nằm trong bản dump.

## Luồng người nhận thư riêng tư
1. Gửi thư (riêng tư / hẹn giờ) → người nhận nhận email thông báo có nút **Mở thư** (cần SMTP).
2. Mở liên kết → màn **"Lá thư riêng tư"**: người nhận phải xác minh đúng email bằng **Google** (email Google phải trùng email người nhận) hoặc **mã 6 số** gửi tới hộp thư (hiệu lực 10 phút, tối đa 5 lần nhập sai, gửi lại sau 60 giây). Không cần tạo tài khoản. Tài khoản HeartPost đã xác minh đúng email cũng mở được, tác giả luôn xem được thư của mình.
3. Sau khi xác minh → phong bì đóng, chạm để mở, lá thư cùng ảnh và băng ghi âm lấp ló; thanh dưới gồm 3 tab: **Thư** (chạm lá thư để đọc), **Ảnh**, **Ghi âm**.
Thư công khai không cần xác minh. Chạy dev với API khác cổng 3000: `API_URL=http://localhost:3999 npm run dev`.
