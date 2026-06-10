#!/bin/bash
# Deploy script - Build locally, push Next.js standalone build to VPS via rsync
# Usage: ./deploy.sh <user@vps-ip> [ssh-key-path] [deploy-path]
#
# Example:
#   ./deploy.sh ubuntu@65.0.168.115 ~/Downloads/vision.pem
#   ./deploy.sh ubuntu@65.0.168.115 ~/Downloads/vision.pem /home/ubuntu/projects/vision_one

set -e

VPS_HOST="${1:-ubuntu@65.0.168.115}"
SSH_KEY="${2:-$HOME/Downloads/vision.pem}"
DEPLOY_PATH="${3:-/home/ubuntu/projects/vision_one}"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"
NVM_INIT="export NVM_DIR=\$HOME/.nvm && source \$NVM_DIR/nvm.sh && export NODE_OPTIONS=--max-old-space-size=512"
PM2_APP_NAME="vision-one-erp"

chmod 600 "$SSH_KEY" 2>/dev/null || true

echo "==> Ensuring remote deploy path & swap exist..."
ssh $SSH_OPTS "$VPS_HOST" "mkdir -p $DEPLOY_PATH/.next $DEPLOY_PATH/public $DEPLOY_PATH/prisma && \
  if [ \$(swapon --show | wc -l) -eq 0 ]; then \
    sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && \
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab; \
  fi"

echo "==> Generating Prisma client locally..."
npx prisma generate

echo "==> Building Next.js app..."
npm run build

echo "==> Syncing .next build output..."
rsync -avz --delete -e "ssh $SSH_OPTS" \
  --exclude='cache' \
  --exclude='dev' \
  --exclude='trace' \
  --exclude='trace-build' \
  --exclude='turbopack' \
  .next/ \
  "$VPS_HOST:$DEPLOY_PATH/.next/"

echo "==> Ensuring uploads directory exists on VPS..."
ssh $SSH_OPTS "$VPS_HOST" "mkdir -p $DEPLOY_PATH/public/uploads"

echo "==> Syncing public/ assets (preserving uploaded files)..."
rsync -avz --delete --exclude='uploads/' -e "ssh $SSH_OPTS" \
  public/ \
  "$VPS_HOST:$DEPLOY_PATH/public/"

echo "==> Syncing Prisma schema & migrations..."
rsync -avz --delete -e "ssh $SSH_OPTS" \
  prisma/ \
  "$VPS_HOST:$DEPLOY_PATH/prisma/"
rsync -avz -e "ssh $SSH_OPTS" \
  prisma.config.ts \
  "$VPS_HOST:$DEPLOY_PATH/prisma.config.ts"

echo "==> Syncing config & package files..."
rsync -avz -e "ssh $SSH_OPTS" \
  package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs \
  "$VPS_HOST:$DEPLOY_PATH/"

echo "==> Installing production dependencies on VPS..."
ssh $SSH_OPTS "$VPS_HOST" "$NVM_INIT && cd $DEPLOY_PATH && npm install --omit=dev --no-fund --no-audit"

echo "==> Generating Prisma client..."
ssh $SSH_OPTS "$VPS_HOST" "$NVM_INIT && cd $DEPLOY_PATH && npx prisma generate"

echo "==> Running pending migrations..."
ssh $SSH_OPTS "$VPS_HOST" "$NVM_INIT && cd $DEPLOY_PATH && npx prisma migrate deploy"

echo "==> Restarting app via pm2..."
ssh $SSH_OPTS "$VPS_HOST" "$NVM_INIT && cd $DEPLOY_PATH && (pm2 delete $PM2_APP_NAME 2>/dev/null || true) && pm2 start npm --name $PM2_APP_NAME -- start && pm2 save"

echo ""
echo "==> Deploy complete!"
echo "    App: running via pm2 ($PM2_APP_NAME) on port 3000"
echo "    Front with nginx reverse proxy to localhost:3000"
