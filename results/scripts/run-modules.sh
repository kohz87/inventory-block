#!/usr/bin/env bash
# Each module missing in turn, and each module older than its requires (requires >=9.0.0 in a copy).
SP=/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
B=/home/user/_break/ui; EXT=$SP/inst/ui/data/default-user/extensions; V=$B/variants
source $SP/inst-ui.env
cd "$(dirname "$0")"
link_all() { local r; for r in Story_block rpg_battle Story_director npc_state_delta; do rm -f $EXT/$r; ln -s $B/$r $EXT/$r; done; }
mkdir -p $V
for r in rpg_battle Story_director npc_state_delta; do
  rm -rf $V/$r; cp -r $B/$r $V/$r; rm -rf $V/$r/.git
done
sed -i "s/requires: { storyBlock: '>=2.0.0-alpha.2' }/requires: { storyBlock: '>=9.0.0' }/" $V/rpg_battle/src/v2/module.js
grep -rl "STORY_BLOCK_RANGE =" $V/Story_director/src | xargs sed -i "s/STORY_BLOCK_RANGE = .*/STORY_BLOCK_RANGE = '>=9.0.0';/"
sed -i "s/requires: Object.freeze({ storyBlock: '>=2.0.0-alpha.2' })/requires: Object.freeze({ storyBlock: '>=9.0.0' })/" $V/npc_state_delta/src/storysuite-v2.js
grep -rn ">=9.0.0" $V | head
for r in rpg_battle Story_director npc_state_delta Story_block; do
  link_all; rm -f $EXT/$r; TAG=missing-$r node probe-modules.mjs | cut -c1-3000
done
for r in rpg_battle Story_director npc_state_delta; do
  link_all; rm -f $EXT/$r; ln -s $V/$r $EXT/$r; TAG=old-$r node probe-modules.mjs | cut -c1-3000
done
link_all
