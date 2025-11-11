Deployment guide (Ubuntu + MySQL/MariaDB)

Overview
- Web (apps/web): static site served by Nginx at https://itsagame.etojesim.com
- API (apps/api): Fastify (Node.js), Prisma with MySQL/MariaDB
- Bot (apps/bot): Telegram bot (long polling), needs BOT_TOKEN and WEBAPP_URL

1) Server prerequisites
- Ubuntu 22.04+
- Node.js 20+: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs
- Git: sudo apt-get install -y git
- MySQL or MariaDB server installed and running

Check DB version
- mysql --version
- mariadb --version (if using MariaDB)
- mysql -u root -p -e "SELECT VERSION();"

2) Create database and user (example)
mysql -u root -p
  CREATE DATABASE mirevald CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'appuser'@'%' IDENTIFIED BY 'StrongP@ssw0rd!';
  GRANT ALL PRIVILEGES ON mirevald.* TO 'appuser'@'%';
  FLUSH PRIVILEGES;
  EXIT;

Connection string (Prisma)
- DATABASE_URL=mysql://appuser:StrongP%40ssw0rd%21@127.0.0.1:3306/mirevald
  (URL-encode special characters, e.g. ! as %21)

3) Clone repository and install
git clone <your-repo-url> /opt/mirevald
cd /opt/mirevald
npm ci

4) Environment
- Copy .env.example to .env and set values:
  - DATABASE_URL (MySQL/MariaDB)
  - API_PORT=4000, HOST=0.0.0.0
  - PRISMA_BACKEND=prisma
  - CORS_ORIGINS=https://itsagame.etojesim.com
  - BOT_TOKEN, WEBAPP_URL=https://itsagame.etojesim.com

5) Prisma generate and migrate
cd apps/api
npx prisma generate
# Fresh DB without existing migrations:
npx prisma db push
# If using recorded migrations instead:
# npx prisma migrate deploy

6) Build
cd /opt/mirevald
npm run build

7) Run services (PM2 example)
npm i -g pm2

# API
cd apps/api
pm2 start dist/index.js --name api

# Bot
cd ../bot
pm2 start npm --name bot -- start:bot

pm2 save
pm2 startup  # enable pm2 on boot (follow instructions)

8) Nginx (HTTPS)
Install Nginx and Certbot
  sudo apt-get install -y nginx
  sudo apt-get install -y certbot python3-certbot-nginx

Basic server block (single domain)
server {
  server_name itsagame.etojesim.com;
  root /opt/mirevald/apps/web/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:4000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri /index.html;
  }
}

Enable HTTPS
  sudo certbot --nginx -d itsagame.etojesim.com

9) Build and publish web app
cd /opt/mirevald/apps/web
npm ci
npm run build
# Ensure Nginx root matches apps/web/dist

Telegram setup
- In BotFather, the Web App button should open WEBAPP_URL=https://itsagame.etojesim.com
- WebApp requires HTTPS; API is proxied by Nginx at /api

