#!/bin/bash
cd "$(dirname "$0")"

BACKUP_DIR="$HOME/Desktop/gym-backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
DEST="$BACKUP_DIR/gym-$TIMESTAMP.db"

if [ ! -f "data/gym.db" ]; then
  echo "找不到 data/gym.db"
  read
  exit 1
fi

cp data/gym.db "$DEST"
echo "已備份到：$DEST"
read -p "按 Enter 結束…"
