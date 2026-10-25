import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('http://127.0.0.1:8150/'); await p.waitForTimeout(10000);
await p.evaluate(async () => SillyTavern.getContext().executeSlashCommandsWithOptions?.('/go Ersveil')); await p.waitForTimeout(5000);
const out = await p.evaluate(() => {
    const sdk = globalThis.StoryBlock.sdk; const ctx = SillyTavern.getContext();
    const all = sdk.receipts();
    return all.map(x => [x.index, x.receipt.type, x.receipt.module, (x.receipt.summary ?? '').slice(0, 80)]);
});
console.log(out.map(x => x.join(' ')).join('\n')); await b.close();
