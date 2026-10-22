// Live probes on the soak's own instance (after the soak): (1) a chat renamed while Story Block's save of a
// change is still on its way; (2) a save that times out (20 s) on the page but that the server writes late,
// after the retry that carries a newer change. A request's "time on the wire" is simulated in the page: the
// save is held before it is sent, ignoring the page's abort, as a body already uploaded to a slow server is.
// usage: node probe-save-race.mjs <chatId>   (env from instance.sh)
import fs from 'node:fs';
import { CHAR_NAME, ST_DATA, ST_URL, connectMock, waitHost } from './lib.mjs';
import { launchRaw } from './cdp-page.mjs';
const CHAT = process.argv[2];
const dir = `${ST_DATA}/default-user/chats/${CHAR_NAME}`;
const { browser, page } = await launchRaw({ port: 9461 });
const ev = (fn, a) => page.evaluate(fn, a);
const out = {};
await page.goto(ST_URL); await waitHost(page); await connectMock(page);
async function open(id) {
    await ev(async ({ id, CHAR_NAME }) => { const c = SillyTavern.getContext(); await c.selectCharacterById(String(c.characters.findIndex(x => x.name === CHAR_NAME))); await new Promise(r => setTimeout(r, 1000)); await c.openCharacterChat(id); await new Promise(r => setTimeout(r, 2500)); }, { id, CHAR_NAME });
}
// Hold the next /api/chats/save `ms` before sending it; the page's abort does not stop it (already uploaded).
const holdNextSave = ms => ev(ms => {
    const real = window.__realFetch ?? (window.__realFetch = window.fetch);
    window.__held = 0;
    window.fetch = function (input, init) {
        const url = typeof input === 'string' ? input : input?.url ?? '';
        if (url.includes('/api/chats/save') && !window.__held) {
            window.__held = 1;
            const body = init.body;
            return new Promise((resolve, reject) => {
                init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
                setTimeout(() => { window.__lateLanded = Date.now(); real(url, { ...init, signal: undefined, body }).then(resolve, reject); }, ms);
            });
        }
        return real.apply(this, arguments);
    };
}, ms);
const present = () => ev(() => [...(StoryBlock.sdk.view().state.domains.scene.present ?? [])]);
const fileHas = (file, name) => { try { return fs.readFileSync(file, 'utf8').includes(name); } catch { return null; } };

// ---- (2) stale overwrite --------------------------------------------------------------------------
await open(CHAT);
const file = `${dir}/${CHAT}.jsonl`;
out.chatBytes = fs.statSync(file).size;
await holdNextSave(26000);
const t0 = Date.now();
out.stale = {};
out.stale.first = await ev(() => StoryBlock.sdk.command('scene.present', { add: 'Probe Alpha' }).then(r => r.ok));
await page.waitForTimeout(1500);
out.stale.second = await ev(() => StoryBlock.sdk.command('scene.present', { add: 'Probe Beta' }).then(r => r.ok));
// Wait for the timeout, the retry and the late write.
await page.waitForFunction(() => Boolean(window.__lateLanded), null, { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(6000);
out.stale.ms = Date.now() - t0;
out.stale.dirtyAfter = await ev(() => StoryBlock.sdk.view?.().dirty ?? null);
out.stale.liveHasBeta = (await present()).includes('Probe Beta');
out.stale.fileHasAlpha = fileHas(file, 'Probe Alpha');
out.stale.fileHasBeta = fileHas(file, 'Probe Beta');
await page.reload(); await waitHost(page); await connectMock(page); await open(CHAT);
out.stale.afterReloadHasBeta = (await present()).includes('Probe Beta');

// ---- (1) rename mid-save ----------------------------------------------------------------------------
const NEW = `${CHAT} renamed`;
await holdNextSave(4000);
out.rename = {};
out.rename.cmd = await ev(() => StoryBlock.sdk.command('scene.present', { add: 'Probe Gamma' }).then(r => r.ok));
await page.waitForTimeout(300);
out.rename.renamed = await ev(async NEW => { const c = SillyTavern.getContext(); await c.executeSlashCommandsWithOptions(`/renamechat ${NEW}`); await new Promise(r => setTimeout(r, 1500)); return c.getCurrentChatId(); }, NEW);
await page.waitForFunction(() => Boolean(window.__lateLanded), null, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(5000);
out.rename.oldFileExists = fs.existsSync(file);
out.rename.oldFileHasGamma = fileHas(file, 'Probe Gamma');
out.rename.newFileHasGamma = fileHas(`${dir}/${out.rename.renamed}.jsonl`, 'Probe Gamma');
out.rename.chatList = fs.readdirSync(dir).filter(f => f.startsWith(CHAT)).length;
console.log(JSON.stringify(out, null, 1));
await browser.close();
