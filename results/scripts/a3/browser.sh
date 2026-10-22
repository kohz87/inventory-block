#!/usr/bin/env bash
# persistent headless chromium on CDP port 9463 for a3 (kill with: pkill -f remote-debugging-port=9463)
D=/tmp/claude-0/-home-user-inventory-block/ec172292-478f-502d-90df-7a419f790d47/scratchpad/chrome-a3
rm -rf $D; mkdir -p $D
nohup /opt/pw-browsers/chromium --headless=new --no-sandbox --remote-debugging-port=9463 --user-data-dir=$D --no-proxy-server --no-first-run \
 --no-default-browser-check --disable-gpu --disable-background-timer-throttling --disable-renderer-backgrounding \
 --disable-backgrounding-occluded-windows --window-size=1440,900 about:blank > /dev/null 2>&1 &
