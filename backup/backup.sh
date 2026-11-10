#!/bin/sh
# Sao lưu PostgreSQL hằng đêm lên Cloudflare R2 (bucket RIÊNG TƯ, khác bucket ảnh công khai).
#   backup.sh loop   : chạy nền, mỗi ngày 1 lần lúc BACKUP_HOUR (mặc định 2h sáng)
#   backup.sh once   : sao lưu ngay 1 lần rồi thoát
#   backup.sh list   : liệt kê các bản sao lưu
set -eu

DB_HOST="${DB_HOST:-db}"; DB_USER="${DB_USER:-heartpost}"; DB_NAME="${DB_NAME:-heartpost}"
BUCKET="${R2_BACKUP_BUCKET:-heartpost-backups}"
RETENTION="${BACKUP_RETENTION_DAYS:-14}"
[ "$RETENTION" -ge 1 ] 2>/dev/null || RETENTION=14   # tối thiểu 1 ngày, tránh lỡ tay xoá sạch
HOUR="${BACKUP_HOUR:-2}"
export TZ="${TZ:-Asia/Ho_Chi_Minh}"
ACC="$(printf '%s' "${R2_ACCOUNT_ID:-}" | sed -e 's#^https\{0,1\}://##' -e 's#\..*$##')"
ENDPOINT="${S3_ENDPOINT:-https://${ACC}.r2.cloudflarestorage.com}"
export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID:-}" AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY:-}" AWS_DEFAULT_REGION=auto
export AWS_REQUEST_CHECKSUM_CALCULATION=when_required AWS_RESPONSE_CHECKSUM_VALIDATION=when_required
export PGPASSWORD="${PGPASSWORD:-${DB_PASSWORD:-}}"

log() { echo "[backup $(date '+%F %T')] $*"; }
s3() { aws --endpoint-url "$ENDPOINT" "$@"; }

check_env() {
  for v in R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY PGPASSWORD; do
    eval "val=\${$v:-}"; [ -n "$val" ] || { log "THIẾU biến môi trường $v"; return 1; }
  done
  [ -n "$ACC" ] || [ -n "${S3_ENDPOINT:-}" ] || { log "THIẾU R2_ACCOUNT_ID"; return 1; }
}

run_once() {
  check_env
  ts="$(date -u +%Y%m%d-%H%M%S)"; f="/tmp/hp-$ts.sql.gz"; key="db/hp-$ts.sql.gz"
  log "pg_dump $DB_NAME@$DB_HOST → $key"
  pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges | gzip -9 > "$f"
  [ "$(wc -c < "$f")" -gt 500 ] || { log "File dump quá nhỏ, bỏ qua"; rm -f "$f"; return 1; }
  if [ -n "${BACKUP_PASSPHRASE:-}" ]; then
    openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_PASSPHRASE -in "$f" -out "$f.enc"; rm -f "$f"; f="$f.enc"; key="$key.enc"
  fi
  size="$(wc -c < "$f")"
  s3 s3 cp "$f" "s3://$BUCKET/$key" --only-show-errors
  s3 s3api head-object --bucket "$BUCKET" --key "$key" >/dev/null   # xác nhận đã lên bucket
  rm -f "$f"; log "OK $key ($size bytes)"
  prune
}

prune() {
  cutoff="$(date -u -d "@$(( $(date +%s) - RETENTION * 86400 ))" +%Y-%m-%dT%H:%M:%SZ)"
  old="$(s3 s3api list-objects-v2 --bucket "$BUCKET" --prefix db/ --query "Contents[?LastModified<'$cutoff'].Key" --output text 2>/dev/null || true)"
  for k in $old; do [ "$k" = "None" ] && continue; s3 s3 rm "s3://$BUCKET/$k" --only-show-errors && log "đã xoá bản cũ $k"; done
}

sleep_until_next() {
  now="$(date +%s)"; next="$(date -d "$(date +%F) $(printf '%02d' "$HOUR"):00:00" +%s)"
  [ "$next" -gt "$now" ] || next=$(( next + 86400 ))
  log "bản sao lưu kế tiếp sau $(( (next - now) / 3600 )) giờ"; sleep $(( next - now ))
}

case "${1:-loop}" in
  once) run_once ;;
  list) s3 s3 ls "s3://$BUCKET/db/" ;;
  loop)
    log "khởi động: giữ $RETENTION ngày, chạy lúc ${HOUR}h ($TZ), bucket=$BUCKET${BACKUP_PASSPHRASE:+, có mã hoá}"
    [ "${BACKUP_ON_START:-true}" = "true" ] && { run_once || log "LỖI sao lưu lần đầu — kiểm tra cấu hình"; }
    while true; do sleep_until_next; run_once || { log "LỖI sao lưu, thử lại sau 1 giờ"; sleep 3600; run_once || log "LỖI lần 2"; }; done ;;
  *) echo "dùng: backup.sh [loop|once|list]"; exit 1 ;;
esac
