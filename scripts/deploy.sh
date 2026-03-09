#!/bin/bash
# DBDO CRM Deploy Script
# Builds and deploys to crm.dbdodev.com

set -e

echo "Building..."
npm run build

echo "Deploying to server..."
scp -i ~/.ssh/id_ed25519 -r dist/index.html fathomless_truth@152.53.241.40:/var/www/crm.dbdodev.com/index.html
scp -i ~/.ssh/id_ed25519 -r dist/assets/* fathomless_truth@152.53.241.40:/var/www/crm.dbdodev.com/assets/
scp -i ~/.ssh/id_ed25519 -r dist/* fathomless_truth@152.53.241.40:/var/www/crm.dbdodev.com/dist/

echo "Setting permissions..."
ssh -i ~/.ssh/id_ed25519 fathomless_truth@152.53.241.40 "chmod 644 /var/www/crm.dbdodev.com/index.html && chmod 644 /var/www/crm.dbdodev.com/assets/*"

echo "Restarting server..."
ssh -i ~/.ssh/id_ed25519 fathomless_truth@152.53.241.40 "pm2 restart crm-dbdo --update-env"

echo "Done. crm.dbdodev.com is live."
