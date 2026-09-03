import test from 'node:test';
import assert from 'node:assert/strict';
import { clearInventoryHistory } from '../src/history.js';
import { commitManualState, ensureRoot, getCurrentInventory, invalidateLineageCache, resolveActiveRevision } from '../src/state.js';
import { SOURCE } from '../src/constants.js';

const item=(name,quantity='1',remark='')=>({name,quantity,remark});
const inv=items=>({categories:[{name:'General',items}]});
const ctx=()=>({chat:[{is_user:false,is_system:false,mes:'tail',extra:{}}],chatMetadata:{}});

test('Clear History rebases durableRevision and survives later tail deletion',()=>{
  const c=ctx();
  commitManualState(c,inv([item('Coin Pouch','1','100 Gold')]),{source:SOURCE.MANUAL});
  clearInventoryHistory(c);
  const root=ensureRoot(c);
  assert.equal(root.activeRevision,0);
  assert.equal(root.durableRevision,0);
  assert.equal(root.durableLength,1);
  assert.equal(root.resolvedLength,1);
  assert.equal(getCurrentInventory(c).categories[0].items[0].name,'Coin Pouch');
  c.chat.length=0;
  invalidateLineageCache(c);
  assert.equal(resolveActiveRevision(c),0);
  assert.equal(getCurrentInventory(c).categories[0].items[0].remark,'100 Gold');
});
