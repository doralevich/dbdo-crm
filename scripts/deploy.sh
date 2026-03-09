#!/bin/bash
# DBDO CRM Deploy Script
# Builds frontend, pushes to GitHub, pulls full repo on server

set -e

echo "Building..."
npm run build

echo "Pushing to GitHub..."
git add -A
git diff --cached --quiet || git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M')"
git push origin main

echo "Deploying to server (git pull + frontend assets)..."
ssh -i ~/.ssh/id_ed25519 fathomless_truth@152.53.241.40 "
  cd /var/www/crm.dbdodev.com &&
  git fetch origin &&
  git reset --hard origin/main &&
  npm install --silent
"

echo "Copying built assets..."
scp -i ~/.ssh/id_ed25519 dist/index.html fathomless_truth@152.53.241.40:/var/www/crm.dbdodev.com/index.html
scp -i ~/.ssh/id_ed25519 -r dist/assets/* fathomless_truth@152.53.241.40:/var/www/crm.dbdodev.com/assets/

echo "Restarting server..."
ssh -i ~/.ssh/id_ed25519 fathomless_truth@152.53.241.40 "pm2 restart crm-dbdo --update-env"

echo "Done. crm.dbdodev.com is live."
