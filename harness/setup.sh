#!/usr/bin/env bash
# Sets up the Story Suite live-test harness on a fresh cloud machine.
# usage: bash harness/setup.sh            (from a checkout of kohz87/inventory-block on this branch)
# Installs SillyTavern 1.19.0 into $SP/st/app with a fresh data folder, links $SP to this harness so the
# scripts' absolute paths work, and sets the chat backup interval to 5 minutes.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SP=/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
mkdir -p "$(dirname "$SP")"
if [ ! -e "$SP" ]; then ln -s "$HERE" "$SP"; fi
mkdir -p "$SP/break" "$SP/inst"
[ -e "$SP/break/b6-soak/scripts" ] || { mkdir -p "$SP/break/b6-soak"; ln -s "$HERE/break-scripts" "$SP/break/b6-soak/scripts"; }
if [ ! -d "$SP/st/app" ]; then
  mkdir -p "$SP/st"
  git clone -q --depth 1 -b 1.19.0 https://github.com/SillyTavern/SillyTavern.git "$SP/st/app"
  (cd "$SP/st/app" && npm ci --no-audit --no-fund --loglevel=error)
fi
cd "$SP/st/app"
# First start makes config.yaml and data/default-user; stop it once they exist.
if [ ! -f data/default-user/settings.json ]; then
  (node server.js --port 8999 > "$SP/st-first.log" 2>&1 &) ; for i in $(seq 1 90); do [ -f data/default-user/settings.json ] && break; sleep 1; done
  pkill -f "server.js --port 8999" || true
fi
# Chat backups at most every 5 minutes (large chats are copied whole on each backup).
sed -i 's/^\(\s*throttleInterval:\).*/\1 300000/' config.yaml
node "$HERE/seed-settings.mjs" data/default-user/settings.json http://127.0.0.1:5099/v1
echo "harness ready: SP=$SP  (SillyTavern $(node -e "console.log(require('./package.json').version)"))"
