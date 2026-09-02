import test from 'node:test';
import assert from 'node:assert/strict';
import { createPromptProbe, injectGenerationPrompt, promptEventMatchesProbe } from '../src/injection.js';

const tok = async text => Math.ceil(String(text).length / 4);



test('probe binds a final prompt to retained conversation', () => {
  const core=[{mes:'a long enough older line'},{mes:'unique final user request 7391'}];
  const probe=createPromptProbe(core);
  assert.equal(promptEventMatchesProbe({chat:[{role:'user',content:'unique final user request 7391'}]},probe), true);
  assert.equal(promptEventMatchesProbe({chat:[{role:'user',content:'other chat request'}]},probe), false);
});

test('chat completion injection is final-only and does not need synthetic core message', async () => {
  const event={chat:[{role:'system',content:'sys'},{role:'user',content:'unique request'}]};
  const probe=['unique request'];
  const result=await injectGenerationPrompt(event,'INVENTORY',{contextSize:1000,getTokenCountAsync:tok,probe});
  assert.equal(result.injected,true);
  assert.deepEqual(event.chat.map(x=>x.content),['sys','INVENTORY','unique request']);
});

test('probe mismatch leaves unrelated raw/background prompt untouched', async () => {
  const event={chat:[{role:'user',content:'background JSON task'}]};
  const before=structuredClone(event);
  const result=await injectGenerationPrompt(event,'INVENTORY',{probe:['foreground unique'],getTokenCountAsync:tok});
  assert.equal(result.injected,false);
  assert.equal(result.reason,'probe-mismatch');
  assert.deepEqual(event,before);
});




test('overflow never prunes tool or conversational messages at prompt-ready stage', async () => {
  const event={chat:[
    {role:'assistant',content:'call',tool_calls:[{id:'x'}]},
    {role:'tool',content:'tool result',tool_call_id:'x'},
    {role:'user',content:'latest request'},
  ]};
  const before=structuredClone(event.chat);
  const result=await injectGenerationPrompt(event,'INVENTORY '.repeat(200),{contextSize:20,getTokenCountAsync:tok,probe:['latest request']});
  assert.equal(result.injected,false);
  assert.equal(result.reason,'context-overflow');
  assert.deepEqual(event.chat,before);
});
