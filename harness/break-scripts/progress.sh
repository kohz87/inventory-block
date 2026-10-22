#!/usr/bin/env bash
# Writes results/progress.md for a run and pushes it: progress.sh <run dir> <label>
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
D="${PROGRESS_DIR:-results}"; mkdir -p "$REPO/$D"
python3 "$HERE/progress.py" "$1" "$2" "$REPO/$D/progress.md" > /dev/null
cd "$REPO"
git add "$D/progress.md"
git commit -q -m "Soak progress: $2 at $(date -u +%H:%M)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01LNpcUVx3BBvtnidfQ9pzUR" || exit 0
for d in 2 4 8 16; do git push -q -u origin claude/beta-soak-results && exit 0; sleep $d; done
exit 1
