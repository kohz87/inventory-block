import test from 'node:test';
import assert from 'node:assert/strict';
import { attachMessageRevision, commitManualState, createRevision, ensureRoot, getCurrentInventory, identityKey, resolveActiveRevision } from '../src/state.js';
import { EXTRA_KEY, SOURCE } from '../src/constants.js';

const inv=(categories)=>({categories});
const item=(name,quantity='1',remark='')=>({name,quantity,remark});
const ctx=(chat=[])=>({chat,chatMetadata:{}});

test('identity key is deterministic unicode-normalized lowercase', () => {
  assert.equal(identityKey('ＡＢＣ'), identityKey('abc'));
  assert.equal(identityKey('I'), 'i');
});

test('new portable checkpoints use compact packed tuples', () => {
  const c=ctx([{is_user:false,is_system:false,mes:'A',extra:{}}]);
  ensureRoot(c);
  const rev=commitManualState(c,inv([{name:'General',items:[item('Gold','1','100')]}]),{source:SOURCE.MANUAL});
  assert.ok(rev>0);
  const cp=c.chat[0].extra[EXTRA_KEY].checkpoint;
  assert.ok(Array.isArray(cp.packed));
  assert.equal('state' in cp,false);
});

test('legacy state checkpoint remains readable for metadata-less branch recovery', () => {
  const original=ctx([{is_user:false,is_system:false,mes:'A',extra:{}}]);
  const root=ensureRoot(original);
  const rev=commitManualState(original,inv([{name:'General',items:[item('Knife')]}]),{source:SOURCE.MANUAL});
  const meta=original.chat[0].extra[EXTRA_KEY];
  meta.checkpoint.state={categories:[{name:'General',items:[item('Knife')]}]};
  delete meta.checkpoint.packed;
  const branched=ctx(structuredClone(original.chat));
  ensureRoot(branched);
  assert.equal(getCurrentInventory(branched).categories[0].items[0].name,'Knife');
  assert.ok(resolveActiveRevision(branched)>=0);
});

test('active swipe metadata restores its own portable inventory revision', () => {
  const c=ctx([{is_user:false,is_system:false,mes:'base',extra:{},swipes:['base','buy sword'],swipe_info:[{},{}],swipe_id:0}]);
  const root=ensureRoot(c);
  const r1=commitManualState(c,inv([{name:'General',items:[item('Gold','1','100')]}]),{source:SOURCE.MANUAL});
  // Construct alternate swipe state from r1.
  c.chat[0].swipe_id=1;
  c.chat[0].mes='buy sword';
  c.chat[0].extra=structuredClone(c.chat[0].swipe_info[0]?.extra ?? c.chat[0].extra);
  root.activeRevision=r1;
  const r2=commitManualState(c,inv([{name:'General',items:[item('Gold','1','90'),item('Sword')]}]),{source:SOURCE.MANUAL});
  const altExtra=structuredClone(c.chat[0].extra);
  c.chat[0].swipe_info[1]={extra:altExtra};
  // Switch back to swipe 0 the same way ST syncs active extra.
  c.chat[0].swipe_id=0;
  c.chat[0].mes='base';
  c.chat[0].extra=structuredClone(c.chat[0].swipe_info[0].extra);
  resolveActiveRevision(c);
  assert.equal(getCurrentInventory(c).categories[0].items.some(x=>x.name==='Sword'),false);
  // Switch to alternate.
  c.chat[0].swipe_id=1;
  c.chat[0].mes='buy sword';
  c.chat[0].extra=structuredClone(c.chat[0].swipe_info[1].extra);
  resolveActiveRevision(c);
  assert.equal(getCurrentInventory(c).categories[0].items.some(x=>x.name==='Sword'),true);
  assert.ok(r2>r1);
});

test('editing a user message invalidates downstream assistant inventory', () => {
  const c=ctx([{is_user:true,is_system:false,mes:'buy sword',extra:{}},{is_user:false,is_system:false,mes:'done',extra:{}}]);
  const root=ensureRoot(c);
  const r=createRevision(c,inv([{name:'General',items:[item('Sword')]}]),{parent:0,source:SOURCE.LLM});
  attachMessageRevision(c,1,{baseRevision:0,revision:r,newUid:true,portable:true});
  c.chat[0].mes='do not buy sword';
  assert.equal(resolveActiveRevision(c),0);
});
