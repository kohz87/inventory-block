import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { consumeInventorySeed, consumeInventoryUpdates, formatInventorySeedBlock, formatInventoryState } from '../src/protocol.js';
import { GenerationSessionStore } from '../src/session.js';
import { createPromptProbe } from '../src/injection.js';
import { attachMessageRevision, createRevision, ensureRoot, getCurrentInventory, resolveActiveRevision } from '../src/state.js';
import { SOURCE } from '../src/constants.js';

const weird=['plain','A | B','A]B','<Inventory>','</Inventory>','-->','\\u003C','∣','{{char}}','ＡＢＣ','ümlaut','İıI'];
const pick=(i)=>weird[i%weird.length];

for(let i=0;i<2000;i++){
  const state={categories:[
    {name:'General',items:[{name:`N${i}-${pick(i)}`,quantity:String((i%9)+1),remark:`R${pick(i+3)}\\${i}`}]},
    {name:`C${i}-${pick(i+1)}`,items:[{name:`X${pick(i+2)}`,quantity:'1 set',remark:`${pick(i+4)} ${i}`}]},
  ]};
  const block=formatInventorySeedBlock(state);
  const parsed=consumeInventorySeed(block);
  assert.deepEqual(parsed.errors,[]);
  assert.deepEqual(parsed.state,state);
}

for(let i=0;i<1000;i++){
  const remark=`route ${i} --> north`;
  const payload={mode:'patch',ops:[{op:'add_item',category:'General',name:`Map${i}`,quantity:1,remark}]};
  const c=`<!-- INVENTORY_BLOCK_UPDATE ${JSON.stringify(payload)} -->.`;
  const source=i%2===0?`Story ${i}. ${c}`:`Before ${i}. ${c}\n\nAfter ${i}.`;
  const r=consumeInventoryUpdates(source,{categories:[]});
  assert.doesNotMatch(r.cleanedText,/INVENTORY_BLOCK_UPDATE/);
  assert.deepEqual(r.errors,[]);
  assert.equal(r.state.categories[0].items[0].remark,remark);
  if(i%2!==0) assert.match(r.cleanedText,new RegExp(`After ${i}\\.$`));
}

for(let i=0;i<500;i++){
  const state={categories:[{name:`${pick(i)}-${i}`,items:[{name:`${pick(i+1)}|${i}`,quantity:'1',remark:`${pick(i+2)}<&>${i}`}]}]};
  const serialized=formatInventoryState(state);
  assert.deepEqual(JSON.parse(serialized),state);
}

for(let i=0;i<1000;i++){
  const store=new GenerationSessionStore({limit:8,maxAgeMs:60000});
  const aChat=[{mes:`A old ${i} unique alpha`},{mes:`A request ${i} omega`}];
  const bChat=[{mes:`B old ${i} unique beta`},{mes:`B request ${i} theta`}];
  const a=store.add({chatId:'A',type:'normal',preProbe:createPromptProbe(aChat),interceptorSeen:false,startChatLength:2});
  const b=store.add({chatId:'B',type:'normal',preProbe:createPromptProbe(bChat),interceptorSeen:false,startChatLength:2},{supersedeUnarmed:false});
  assert.equal(store.chooseForInterceptor(aChat,'normal'),a);
  assert.equal(store.chooseForInterceptor(bChat,'normal'),b);
}

function ctx(chat=[]){return {chat,chatMetadata:{}};}
function stateFor(n){return {categories:[{name:'General',items:[{name:'Counter',quantity:'1',remark:String(n)}]}]};}
for(let run=0;run<200;run++){
  const c=ctx();
  const root=ensureRoot(c);
  let parent=0;
  const assistantIds=[];
  const revs=[];
  for(let n=1;n<=12;n++){
    c.chat.push({is_user:true,is_system:false,mes:`u${n}`,extra:{}});
    c.chat.push({is_user:false,is_system:false,mes:`a${n}`,extra:{}});
    const id=c.chat.length-1;
    const rev=createRevision(c,stateFor(n),{parent,source:SOURCE.LLM});
    attachMessageRevision(c,id,{baseRevision:parent,revision:rev,newUid:true,portable:true});
    assistantIds.push(id);revs.push(rev);parent=rev;
  }
  const cut=1+(run%10);
  c.chat.splice(assistantIds[cut],1);
  const resolved=resolveActiveRevision(c);
  assert.equal(getCurrentInventory(c).categories[0].items[0].remark,String(cut));
  assert.ok(Number.isInteger(resolved));
}

// Metadata-less portable hydration should remain linear-ish and recover the last checkpoint.
{
  const original=ctx();
  ensureRoot(original);
  let parent=0;
  for(let i=0;i<200;i++){
    original.chat.push({is_user:false,is_system:false,mes:`assistant ${i}`,extra:{}});
    if(i%10===0){
      const rev=createRevision(original,stateFor(i+1),{parent,source:SOURCE.LLM});
      attachMessageRevision(original,i,{baseRevision:parent,revision:rev,newUid:true,portable:true});
      parent=rev;
    }
  }
  const branch=ctx(structuredClone(original.chat));
  const t0=performance.now();
  ensureRoot(branch);
  const ms=performance.now()-t0;
  assert.ok(ms<500,`portable hydration too slow: ${ms.toFixed(1)}ms`);
  assert.ok(getCurrentInventory(branch).categories.length>0);
}

console.log('hardpass fuzz: PASS');
