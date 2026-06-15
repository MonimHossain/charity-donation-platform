#!/bin/bash
# Deploy prod branch build to Hostinger VPS via rsync (no GitHub needed on server).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-root@82.29.190.206}"
REMOTE_DIR="/home/deployment/production/your-impact"

cd "$ROOT"

echo "==> Building locally..."
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://yourimpactdev.com/api/v1}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://yourimpactdev.com}"
export NEXT_PUBLIC_USE_MOCK_DATA=false
pnpm build

echo "==> Syncing to $HOST:$REMOTE_DIR"
if [ -n "${DEPLOY_SSH_PASS:-}" ]; then
  export RSYNC_RSH="sshpass -e ssh -o StrictHostKeyChecking=no"
  export SSHPASS="$DEPLOY_SSH_PASS"
  sshpass -e rsync -avz --delete \
    --exclude node_modules --exclude .git \
    ./ "$HOST:$REMOTE_DIR/"
else
  rsync -avz --delete \
    --exclude node_modules --exclude .git \
    ./ "$HOST:$REMOTE_DIR/"
fi

echo "==> Running remote deploy"
if [ -n "${DEPLOY_SSH_PASS:-}" ]; then
  sshpass -e ssh -o StrictHostKeyChecking=no "$HOST" \
    "bash $REMOTE_DIR/scripts/remote-deploy.sh"
else
  ssh "$HOST" "bash $REMOTE_DIR/scripts/remote-deploy.sh"
fi

echo "==> Done. Check https://yourimpactdev.com"
