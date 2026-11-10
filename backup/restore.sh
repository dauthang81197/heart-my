#!/bin/sh
# Khôi phục từ bản sao lưu:  restore.sh <key|latest> [tên_database_đích]
# Ví dụ:  docker compose run --rm --entrypoint restore.sh backup latest heartpost_restore
set -eu
KEY="${1:?cần key hoặc 'latest'}"; TARGET="${2:-${DB_NAME:-heartpost}}"
DB_HOST="${DB_HOST:-db}"; DB_USER="${DB_USER:-heartpost}"; BUCKET="${R2_BACKUP_BUCKET:-heartpost-backups}"
ACC="$(printf '%s' "${R2_ACCOUNT_ID:-}" | sed -e 's#^https\{0,1\}://##' -e 's#\..*$##')"
ENDPOINT="${S3_ENDPOINT:-https://${ACC}.r2.cloudflarestorage.com}"
export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID:-}" AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY:-}" AWS_DEFAULT_REGION=auto
export AWS_REQUEST_CHECKSUM_CALCULATION=when_required AWS_RESPONSE_CHECKSUM_VALIDATION=when_required
export PGPASSWORD="${PGPASSWORD:-${DB_PASSWORD:-}}"
s3() { aws --endpoint-url "$ENDPOINT" "$@"; }

if [ "$KEY" = "latest" ]; then
  KEY="$(s3 s3api list-objects-v2 --bucket "$BUCKET" --prefix db/ --query 'sort_by(Contents,&LastModified)[-1].Key' --output text)"
fi
case "$KEY" in db/*) ;; *) KEY="db/$KEY" ;; esac
echo "Khôi phục $KEY → database '$TARGET' trên $DB_HOST"
s3 s3 cp "s3://$BUCKET/$KEY" /tmp/restore.bin --only-show-errors
case "$KEY" in
  *.enc) openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_PASSPHRASE -in /tmp/restore.bin | gunzip > /tmp/restore.sql ;;
  *) gunzip -c /tmp/restore.bin > /tmp/restore.sql ;;
esac
psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$TARGET\"" 2>/dev/null || echo "(database '$TARGET' đã tồn tại, nạp vào đó)"
psql -h "$DB_HOST" -U "$DB_USER" -d "$TARGET" -v ON_ERROR_STOP=1 -q -f /tmp/restore.sql
echo "Xong."
