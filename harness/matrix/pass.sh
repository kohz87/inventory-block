#!/usr/bin/env bash
# One matrix pass: pull v2 of the four repos into /home/user/_break/pass, run every cell (4 slots in parallel,
# each slot's cells one after another), then collect results into results/.
# usage: pass.sh <pass number>
set -uo pipefail
P="$1"
HERE="$(cd "$(dirname "$0")" && pwd)"
SP=/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
R=/home/user/_break/pass
mkdir -p "$R"
for r in Story_block rpg_battle Story_director npc_state_delta; do
  if [ -d "$R/$r/.git" ]; then (cd "$R/$r" && git fetch -q origin v2 && git checkout -q v2 && git reset -q --hard origin/v2); else git clone -q -b v2 "https://github.com/kohz87/$r.git" "$R/$r"; fi
done
SEED=$((4111 + P))
NSDV1="$SP/matrix/nsd-v1-settings.json"
slot() { local s="$1"; shift; for cell in "$@"; do local tag="p$P-${cell%%:*}"; local kv="${cell#*:}"; IFS=' ' read -ra args <<< "$kv"; bash "$HERE/run-config.sh" "$s" "$tag" "$R" "${args[@]}"; done; }
slot 1 "c1-desk:FEATURES=all VIEW=desk" "c1-phone:FEATURES=all VIEW=phone" "c3-x10:PACK_MODE=none ECON=10" &
slot 2 "c2-off:FEATURES=off" "c2-half:FEATURES=random:$SEED" "c4-noNSD:MODULES=Story_block,rpg_battle,Story_director" &
slot 3 "c3-gold:PACK_MODE=none" "c3-x0.1:PACK_MODE=none ECON=0.1" "c4-noSD:MODULES=Story_block,rpg_battle,npc_state_delta" &
if [ -f "$NSDV1" ]; then slot 4 "c4-noRB:MODULES=Story_block,Story_director,npc_state_delta" "c4-nsdv1:SEED_SETTINGS=$NSDV1" & else slot 4 "c4-noRB:MODULES=Story_block,Story_director,npc_state_delta" & fi
wait
python3 "$HERE/collect.py" "$P"
