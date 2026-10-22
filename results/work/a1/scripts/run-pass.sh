#!/bin/bash
# Pass runner: chunks of seeds, one process at a time, nice + timeout. Usage: run-pass.sh <from> <to> <steps> <chunk> <tag>
# Env: PACK (default mix), PROFILE (default: alternate mix/long per chunk), B2ROOT (default /home/user/cell/a1)
cd "$(dirname "$0")"
FROM=$1; TO=$2; STEPS=$3; CHUNK=${4:-10}; TAG=${5:-p1}
export B2ROOT=${B2ROOT:-/home/user/cell/a1} PACK=${PACK:-mix}
OUTD=${OUTD:-out}; mkdir -p $OUTD
n=0
for ((s=FROM; s<=TO; s+=CHUNK)); do
  e=$((s+CHUNK-1)); [ $e -gt $TO ] && e=$TO
  prof=${PROFILE_FIXED:-$([ $((n%2)) -eq 0 ] && echo long || echo mix)}
  PROFILE=$prof timeout 1500 nice -n 10 node ${FUZZ:-fuzz.mjs} $s $e $STEPS --out=$OUTD/$TAG-$s-$e.json > $OUTD/$TAG-$s-$e.log 2>&1
  echo "chunk $s-$e ($prof) exit $?" >> $OUTD/$TAG-progress.txt
  n=$((n+1))
done
echo done >> $OUTD/$TAG-progress.txt
