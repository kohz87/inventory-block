#!/usr/bin/env bash
# One matrix cell: a fresh SillyTavern data folder, the chosen modules, st-beta.mjs under the chosen knobs, then stop.
# usage: run-config.sh <slot 0-4> <tag> <repos-dir> [VAR=value ...]
#   slot x → SillyTavern 82x1, mock 52x1, CDP 94x1 (+1 for the phone page).
#   VAR: VIEW PACK_MODE FEATURES ECON MODULES (comma list of repos to link; default all four)
#        SEED_SETTINGS (a JSON file merged into extension_settings before start, e.g. NSD v1-era settings)
# Writes $SP/beta-e2e/scenario/<tag>/ (result.md, rows.json, console.txt, static-hashes.txt, shots/).
set -uo pipefail
SP=/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
SLOT="$1"; TAG="$2"; REPOS="$3"; shift 3
VIEW=desk PACK_MODE=ersveil FEATURES=keep ECON="" MODULES="Story_block,rpg_battle,Story_director,npc_state_delta" SEED_SETTINGS=""
for kv in "$@"; do declare "$kv"; done
PORT=82${SLOT}1; MPORT=52${SLOT}1; CDP=94${SLOT}1
NAME="m$SLOT"; ROOT="$SP/inst/$NAME"
avail=$(free -m | awk '/^Mem:/{print $7}')
if [ "$avail" -lt 3072 ]; then echo "SKIPPED $TAG: only ${avail} MB free"; exit 3; fi
stop() { pkill -f "server.js --port $PORT" 2>/dev/null; pkill -f "queue.mjs $ROOT/q" 2>/dev/null; pkill -f "remote-debugging-port=$CDP" 2>/dev/null; pkill -f "remote-debugging-port=$((CDP + 1))" 2>/dev/null; sleep 2; }
stop
rm -rf "$ROOT"
mkdir -p "$ROOT/q" "$ROOT/log"
cp -a "$SP/st/app/data" "$ROOT/data"
rm -rf "$ROOT/data/default-user/extensions/"{Story_block,rpg_battle,Story_director,npc_state_delta}
if [ -n "$SEED_SETTINGS" ]; then
  node -e 'const fs=require("fs");const [f,s]=process.argv.slice(1);const j=JSON.parse(fs.readFileSync(f));j.extension_settings??={};Object.assign(j.extension_settings,JSON.parse(fs.readFileSync(s)));fs.writeFileSync(f,JSON.stringify(j,null,4));' "$ROOT/data/default-user/settings.json" "$SEED_SETTINGS"
fi
exts=(); n=0
IFS=, read -ra mods <<< "$MODULES"
for m in "${mods[@]}"; do exts+=("$m=$REPOS/$m"); n=$((n + 1)); done
timeout 150 bash "$SP/instance.sh" "$NAME" "$PORT" "$MPORT" "${exts[@]}" > "$SP/inst-$NAME.env" 2>&1
source "$SP/inst-$NAME.env"
cd "$SP/smoke"
REPOS="$REPOS" CDP_PORT=$CDP VIEW=$VIEW PACK_MODE=$PACK_MODE FEATURES=$FEATURES ECON=$ECON MODULES_EXPECTED=$n \
  timeout 2700 node st-beta.mjs --tag "$TAG" > "$SP/beta-e2e/run-$TAG.out" 2>&1
code=$?
echo "{\"tag\":\"$TAG\",\"exit\":$code,\"VIEW\":\"$VIEW\",\"PACK_MODE\":\"$PACK_MODE\",\"FEATURES\":\"$FEATURES\",\"ECON\":\"$ECON\",\"MODULES\":\"$MODULES\",\"SEED_SETTINGS\":\"$SEED_SETTINGS\"}" > "$SP/beta-e2e/scenario/$TAG/run.json" 2>/dev/null
cp "$ROOT/st.log" "$SP/beta-e2e/scenario/$TAG/st.log" 2>/dev/null
# Keep the mock's request log (the next run on this slot deletes $ROOT).
mkdir -p "$SP/beta-e2e/scenario/$TAG/mocklog" && cp "$ROOT/log/"req-*.json "$SP/beta-e2e/scenario/$TAG/mocklog/" 2>/dev/null
stop
echo "DONE $TAG exit $code"
tail -3 "$SP/beta-e2e/run-$TAG.out"
