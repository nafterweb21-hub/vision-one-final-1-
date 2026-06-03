#!/bin/bash
# One-time VPS bootstrap for a fresh Ubuntu Lightsail box.
# Installs: Node 20 (via nvm), pm2, PostgreSQL 16, nginx.
# Usage: ./setup-vps.sh <user@vps-ip> [ssh-key-path] [deploy-path] [db-name] [db-user] [db-password]

set -e

VPS_HOST="${1:-ubuntu@65.0.168.115}"
SSH_KEY="${2:-$HOME/Downloads/vision.pem}"
DEPLOY_PATH="${3:-/home/ubuntu/projects/vision_one}"
DB_NAME="${4:-vision_one}"
DB_USER="${5:-vision}"
DB_PASS="${6:-changeme}"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"

chmod 600 "$SSH_KEY" 2>/dev/null || true

echo "==> Bootstrapping VPS at $VPS_HOST..."

ssh $SSH_OPTS "$VPS_HOST" bash -s <<EOF
set -e

echo "--> apt update & base packages"
sudo apt-get update -y
sudo apt-get install -y curl git build-essential nginx postgresql postgresql-contrib

echo "--> installing nvm + Node 20"
if [ ! -d "\$HOME/.nvm" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
export NVM_DIR="\$HOME/.nvm"
source "\$NVM_DIR/nvm.sh"
nvm install 20
nvm alias default 20

echo "--> installing pm2"
npm install -g pm2

echo "--> configuring Postgres role & db"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres createdb -O $DB_USER $DB_NAME

echo "--> creating deploy directory"
mkdir -p $DEPLOY_PATH

echo "--> writing .env (edit DATABASE_URL / NEXTAUTH_SECRET afterwards)"
if [ ! -f $DEPLOY_PATH/.env ]; then
  cat > $DEPLOY_PATH/.env <<ENV
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
NEXTAUTH_URL="http://65.0.168.115"
NEXTAUTH_SECRET="$(openssl rand -hex 32)"
NODE_ENV=production
ENV
fi

echo "--> nginx reverse proxy on :80 -> :3000"
sudo tee /etc/nginx/sites-available/vision_one >/dev/null <<NGINX
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/vision_one /etc/nginx/sites-enabled/vision_one
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "--> pm2 startup on boot"
pm2 startup systemd -u \$USER --hp \$HOME | tail -n 1 | sudo bash || true

echo "--> done."
EOF

echo ""
echo "==> VPS bootstrap complete!"
echo "    Next: ./deploy.sh $VPS_HOST $SSH_KEY $DEPLOY_PATH"
echo "    Then visit: http://${VPS_HOST#*@}/"
