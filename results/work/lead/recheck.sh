#!/bin/bash
# Pull the four repos in /home/user/cell and run every results/tests/<repo>/*.test.js from that repo's tests/v2/break/.
R=/home/user/inventory-block/results/tests
cd /home/user/cell
for r in Story_block rpg_battle Story_director npc_state_delta; do
  git -C $r pull -q --ff-only origin v2
  echo "== $r $(git -C $r rev-parse --short HEAD)"
  ls $R/$r/*.test.js >/dev/null 2>&1 || continue
  for f in $R/$r/*.test.js; do cp $f $r/tests/v2/break/; done
  for f in $R/$r/*.test.js; do
    b=$(basename $f)
    out=$(cd $r && timeout 300 node --test tests/v2/break/$b 2>&1)
    echo "$b pass=$(echo "$out"|grep -E '^# pass'|awk '{print $3}') fail=$(echo "$out"|grep -E '^# fail'|awk '{print $3}')"
  done
  for f in $R/$r/*.test.js; do rm -f $r/tests/v2/break/$(basename $f); done
done
cd Story_block; for n in $(git ls-remote origin 'refs/pull/*/head' | awk '{print $2}' | sed 's#refs/pull/##;s#/head##' | sort -n | tail -5); do git fetch -q origin pull/$n/head:pr-$n 2>/dev/null; echo "SB #$n $(git merge-base --is-ancestor pr-$n origin/v2 && echo MERGED || echo open) $(git log -1 --format=%s pr-$n|cut -c1-90)"; done
