#!/usr/bin/env bash
# Writes results/progress.md for a run and pushes it: progress.sh <run dir> <label>
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
mkdir -p "$REPO/results"
python3 "$HERE/progress.py" "$1" "$2" "$REPO/results/progress.md" > /dev/null
cd "$REPO"
git add results/progress.md
git commit -q -m "Soak progress: $2 at $(date -u +%H:%M)" || exit 0
for d in 2 4 8 16; do git push -q -u origin claude/beta-soak-results && exit 0; sleep $d; done
exit 1
