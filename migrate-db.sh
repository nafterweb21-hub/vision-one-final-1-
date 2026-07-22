#!/bin/bash
# Dump local Postgres -> restore on VPS Postgres.
# Uses local .env DATABASE_URL for source, VPS .env DATABASE_URL for target.
# Usage: ./migrate-db.sh [user@vps-ip] [ssh-key] [deploy-path]

set -e

VPS_HOST="${1:-ubuntu@65.0.168.115}"
SSH_KEY="${2:-$HOME/Downloads/vision.pem}"
DEPLOY_PATH="${3:-/home/ubuntu/projects/vision_one}"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"
DUMP_FILE="/tmp/vision_one_$(date +%Y%m%d_%H%M%S).dump"

chmod 600 "$SSH_KEY" 2>/dev/null || true

# Source local DATABASE_URL
set -a
source ./.env
set +a

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not set in ./.env"
  exit 1
fi

echo "==> Dumping local DB (custom format)..."
pg_dump --no-owner --no-privileges --format=custom --file="$DUMP_FILE" "$DATABASE_URL"
ls -lh "$DUMP_FILE"

echo "==> Copying dump to VPS..."
scp $SSH_OPTS "$DUMP_FILE" "$VPS_HOST:/tmp/vision_one.dump"

echo "==> Restoring on VPS (drops & recreates schema in target DB)..."
ssh $SSH_OPTS "$VPS_HOST" bash <<EOF
set -e
set -a
source $DEPLOY_PATH/.env
set +a
if [ -z "\$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not set in $DEPLOY_PATH/.env"
  exit 1
fi
echo "--> dropping & recreating public schema"
psql "\$DATABASE_URL" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
echo "--> pg_restore"
pg_restore --no-owner --no-privileges --clean --if-exists --dbname "\$DATABASE_URL" /tmp/vision_one.dump || true
echo "--> done"
rm -f /tmp/vision_one.dump
EOF

rm -f "$DUMP_FILE"
echo ""
echo "==> Migration complete!"
