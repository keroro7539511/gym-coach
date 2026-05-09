#!/bin/bash
cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "首次啟動，安裝相依套件…"
  npm install || { echo "安裝失敗"; read; exit 1; }
fi

if [ ! -f "data/gym.db" ]; then
  echo "首次啟動，建立資料庫…"
  npx drizzle-kit migrate || { echo "建表失敗"; read; exit 1; }
fi

echo "啟動 server，瀏覽器將自動打開 http://localhost:3000"
( sleep 3 && open http://localhost:3000 ) &
npm run dev
