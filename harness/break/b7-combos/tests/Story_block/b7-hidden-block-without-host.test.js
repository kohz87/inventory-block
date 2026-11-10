// B-b7-combos-10: Story Block hides a captured <Changes> block by rewriting the reply's text into an
// HTML comment (`<!-- STORY_SUITE_V2 <Changes>…</Changes> -->`, turn.js hideBlock) and strips it from
// the prompt only while it runs (onPromptReady stripHistory). With Story Block switched off or
// uninstalled mid-chat (RPG Battle and Story Director then do not load at all), every earlier reply
// still carries its block in `mes`, and SillyTavern sends it to the model: live, 3 hidden blocks in a
// 4-reply chat, with the change grammar (+ quest, ~ wound…) the model then imitates in plain text.
// The data is already kept in message.extra.storySuite (spans/receipts) for Re-read.
// Drop into Story_block/tests/v2/break/.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createHost } from '../../../testkit/index.js';

test('a captured reply\'s stored text does not keep the change block for whoever reads mes without Story Block', async () => {
    const host = await createHost();
    await host.send('Any work?', 'Hollis nods at the cellar.\n<Changes>\n+ item Rope | qty: 1\n~ place Bluewatch | kind: settlement\n</Changes>');
    const reply = host.ctx.chat.at(-1);
    assert.equal(Object.values(host.head().domains.inventory.stacks).length, 1, 'captured');
    for (const text of [reply.mes, ...(reply.swipes ?? [])]) {
        assert.doesNotMatch(String(text), /\+ item Rope|<Changes>/, 'the change lines stay in the text SillyTavern sends when Story Block is not running');
    }
    host.close();
});
