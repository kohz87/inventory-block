#!/usr/bin/env bash
# A private test SillyTavern + mock model for one agent.
# usage: instance.sh <name> <st-port> <mock-port> [ext=path ...]
#   ext: one of Story_block Story_director npc_state_delta rpg_battle, pointed at a worktree.
# Prints the env to export: ST_URL, MOCK_URL, MOCK_Q, MOCK_LOG, ST_DATA.
set -euo pipefail
SP=/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
NAME="$1"; PORT="$2"; MPORT="$3"; shift 3
ROOT="$SP/inst/$NAME"
mkdir -p "$ROOT/q" "$ROOT/log"
if [ ! -d "$ROOT/data" ]; then cp -a "$SP/st/app/data" "$ROOT/data"; fi
[ -f "$SP/seed-settings.mjs" ] && node "$SP/seed-settings.mjs" "$ROOT/data/default-user/settings.json" "http://127.0.0.1:$MPORT/v1"
EXT="$ROOT/data/default-user/extensions"
for pair in "$@"; do
  ext="${pair%%=*}"; path="${pair#*=}"
  [ -e "$EXT/$ext" ] || [ -L "$EXT/$ext" ] && rm -f "${EXT:?}/$ext"
  ln -s "$path" "$EXT/$ext"
done
if ! curl -s --max-time 3 -o /dev/null "http://127.0.0.1:$PORT/"; then
  (cd "$SP/st/app" && nohup node server.js --port "$PORT" --dataRoot "$ROOT/data" > "$ROOT/st.log" 2>&1 &)
fi
if ! curl -s --max-time 3 -o /dev/null "http://127.0.0.1:$MPORT/"; then
  (nohup node "$SP/mock/queue.mjs" "$ROOT/q" "$ROOT/log" "$MPORT" > "$ROOT/mock.log" 2>&1 &)
fi
for i in $(seq 1 60); do curl -s --max-time 3 -o /dev/null "http://127.0.0.1:$PORT/" && break; sleep 1; done
echo "export ST_URL=http://127.0.0.1:$PORT/ MOCK_URL=http://127.0.0.1:$MPORT/v1 MOCK_Q=$ROOT/q MOCK_LOG=$ROOT/log ST_DATA=$ROOT/data"
