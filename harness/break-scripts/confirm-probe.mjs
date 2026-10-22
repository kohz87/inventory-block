// Confirm soak: one-off probe of the live page (context size, features, the static part's grammar).
import fs from 'node:fs';
import { CHAR_NAME, MOCK_LOG, ST_URL, clearQueue, connectMock, queue, reqNums, readReq, waitHost } from './lib.mjs';
import { launchRaw } from './cdp-page.mjs';
const { browser, page } = await launchRaw({ port: Number(process.env.CDP_PORT) + 2 });
await page.goto(ST_URL); await waitHost(page); await connectMock(page);
clearQueue();
const info = await page.evaluate(async CHAR_NAME => {
    const ctx = SillyTavern.getContext();
    await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === CHAR_NAME)));
    await new Promise(r => setTimeout(r, 1500));
    const sdk = StoryBlock.sdk;
    return { max: ctx.chatCompletionSettings?.openai_max_context, reply: ctx.chatCompletionSettings?.openai_max_tokens, sdkKeys: Object.keys(sdk), features: typeof sdk.features === 'function' ? sdk.features() : null };
}, CHAR_NAME);
console.log('max', info.max, 'reply', info.reply); for (const f of info.features ?? []) console.log('feature', f.id, 'default', f.default, 'prompt', f.prompt, 'on', f.on, f.available);
queue('The rain keeps on.\n\n<Changes>\n! time +1h\n</Changes>');
const before = reqNums().at(-1) ?? 0;
await page.fill('#send_textarea', 'I look around.'); await page.click('#send_but');
await page.waitForTimeout(8000);
const n = reqNums().filter(x => x > before);
for (const x of n) { const b = readReq(x); const t = (b.messages ?? []).map(m => `### ${m.role}\n${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`).join('\n'); fs.writeFileSync(`/tmp/probe-req-${x}.txt`, t); console.log('req', x, t.length, 'max_tokens', b.max_tokens); }
await browser.close();
