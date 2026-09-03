import test from 'node:test';
import assert from 'node:assert/strict';
import { GenerationSessionStore } from '../src/session.js';
import { createPromptProbe } from '../src/injection.js';

test('interceptor selection binds by chat content instead of currently selected UI chat', () => {
  const store=new GenerationSessionStore({limit:8,maxAgeMs:60000});
  const chatA=[{mes:'A old assistant unique 111'},{mes:'A request unique 222'}];
  const chatB=[{mes:'B old assistant unique 333'},{mes:'B request unique 444'}];
  const a=store.add({chatId:'A',type:'normal',preProbe:createPromptProbe(chatA),interceptorSeen:false,startChatLength:2});
  const b=store.add({chatId:'B',type:'normal',preProbe:createPromptProbe(chatB),interceptorSeen:false,startChatLength:2},{supersedeUnarmed:false});
  assert.equal(store.chooseForInterceptor(chatA,'normal'),a);
  assert.equal(store.chooseForInterceptor(chatB,'normal'),b);
});

test('ambiguous interceptor never guesses when multiple sessions do not match', () => {
  const store=new GenerationSessionStore({limit:8,maxAgeMs:60000});
  store.add({chatId:'A',type:'normal',preProbe:['AAA unique'],interceptorSeen:false,startChatLength:1});
  store.add({chatId:'B',type:'normal',preProbe:['BBB unique'],interceptorSeen:false,startChatLength:1},{supersedeUnarmed:false});
  assert.equal(store.chooseForInterceptor([{mes:'CCC'}],'normal'),null);
});

test('prompt event chooses only the armed session whose probe is present', () => {
  const store=new GenerationSessionStore({limit:8,maxAgeMs:60000});
  const a=store.add({chatId:'A',type:'normal',preProbe:[],interceptorSeen:true,interceptorAt:Date.now(),promptProbe:['A request'],startChatLength:1});
  const b=store.add({chatId:'B',type:'normal',preProbe:[],interceptorSeen:true,interceptorAt:Date.now()+1,promptProbe:['B request'],startChatLength:1},{supersedeUnarmed:false});
  assert.equal(store.chooseForPromptEvent({chat:[{role:'user',content:'A request'}]}),a);
  assert.equal(store.chooseForPromptEvent({chat:[{role:'user',content:'B request'}]}),b);
  assert.equal(store.chooseForPromptEvent({chat:[{role:'user',content:'raw task'}]}),null);
});

test('message matching stays scoped to chat id', () => {
  const store=new GenerationSessionStore({limit:8,maxAgeMs:60000});
  const a=store.add({chatId:'A',type:'normal',preProbe:[],interceptorSeen:true,startChatLength:2});
  assert.equal(store.forMessage('A',3,'normal'),a);
  assert.equal(store.forMessage('B',3,'normal'),null);
});
