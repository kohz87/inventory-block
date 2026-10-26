#!/usr/bin/env bash
# Rebuild the local smoke SillyTavern from scratch (separate data root; never the user's). Idempotent.
# Usage: [NOPACK=1] bash suite-notes/smoke/setup.sh [ref]   (ref = extensions branch/tag, default main; NOPACK=1 leaves the pack out so import.mjs installs it through the UI)
set -euo pipefail
REF="${1:-main}"
ROOT=/home/user/st-smoke
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$ROOT"
if [ ! -d "$ROOT/SillyTavern" ]; then
  git clone -q --depth 1 -b 1.19.0 https://github.com/SillyTavern/SillyTavern.git "$ROOT/SillyTavern"
  (cd "$ROOT/SillyTavern" && npm ci --no-audit --no-fund > "$ROOT/npm.log" 2>&1)
fi
cd "$ROOT/SillyTavern"
[ -f config.yaml ] || cp default/config.yaml config.yaml
sed -i -E "s|^dataRoot:.*|dataRoot: $ROOT/data|; s|^port:.*|port: 8150|; s|^listen:.*|listen: false|" config.yaml
# First boot creates data/default-user; stop it once the user folder exists.
if [ ! -d "$ROOT/data/default-user" ]; then
  (node server.js > "$ROOT/st.log" 2>&1 & echo $! > "$ROOT/st.pid")
  for i in $(seq 1 60); do [ -f "$ROOT/data/default-user/settings.json" ] && break; sleep 2; done
  kill "$(cat "$ROOT/st.pid")" 2>/dev/null || true; sleep 2
fi
EXT="$ROOT/data/default-user/extensions"; mkdir -p "$EXT"
for r in Story_block Story_director rpg_battle npc_state_delta; do
  [ -d "$EXT/$r" ] || git clone -q "https://github.com/kohz87/$r.git" "$EXT/$r"
  git -C "$EXT/$r" fetch -q origin "$REF" && git -C "$EXT/$r" checkout -q FETCH_HEAD
done
node - "$ROOT/data/default-user/settings.json" "$EXT/Story_block/examples/packs/ersveil-bluewatch/pack.json" <<'NODE'
const fs = require('fs');
const [file, packFile] = process.argv.slice(2);
const s = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
s.firstRun = false; s.username = 'Wessel'; s.main_api = 'openai';
s.oai_settings = { ...(s.oai_settings ?? {}), chat_completion_source: 'custom', custom_url: 'http://127.0.0.1:5001/v1',
  custom_model: 'smoke-mock', stream_openai: false, openai_max_context: 32768 };
const pack = JSON.parse(fs.readFileSync(packFile, 'utf8'));
s.extension_settings = s.extension_settings ?? {};
s.extension_settings.storySuite = { ...(s.extension_settings.storySuite ?? {}),
  packs: process.env.NOPACK ? [] : [{ id: pack.id, version: pack.version, enabled: true, source: 'file', origin: 'pack.json', pack }] };
fs.writeFileSync(file, JSON.stringify(s, null, 4));
console.log(`settings ok; pack ${pack.id} ${pack.version}`);
NODE
echo "setup done ($REF). Start: cd $ROOT/SillyTavern && (nohup node server.js > $ROOT/st.log 2>&1 & echo \$! > $ROOT/st.pid); cd $HERE && (nohup node mock.mjs > $ROOT/mock.out 2>&1 & echo \$! > $ROOT/mock.pid)"
