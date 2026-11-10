import { createRequire } from 'node:module';
export const { chromium } = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');
export const SC = process.env.SMOKE_OUT ?? '/home/user/st-smoke/ersveil';
export async function launch(opts = {}) {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: opts.viewport ?? { width: 1280, height: 900 } });
    const errors = [], cons = [];
    page.on('pageerror', e => errors.push(String(e?.stack ?? e).slice(0, 500)));
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) cons.push(`${m.type()}: ${m.text()}`.slice(0, 400)); });
    await page.goto('http://127.0.0.1:8150/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => globalThis.StoryBlock?.sdk && document.querySelector('#send_textarea'), null, { timeout: 120000 });
    await page.waitForTimeout(5000);
    return { browser, page, errors, cons };
}
export const ev = (p, fn, a) => p.evaluate(fn, a);
export async function clickText(p, text, exact = true) { const b = p.getByText(text, { exact }); for (let n = 0; n < await b.count(); n++) if (await b.nth(n).isVisible()) { await b.nth(n).click(); await p.waitForTimeout(1200); return true; } return false; }
export async function clickButton(p, name) { const b = p.getByRole('button', { name }); for (let n = 0; n < await b.count(); n++) if (await b.nth(n).isVisible()) { await b.nth(n).click(); await p.waitForTimeout(1200); return true; } return false; }
export async function send(p, text, wait = 3000) {
    const before = await p.evaluate(() => document.querySelectorAll('#chat .mes').length);
    await p.fill('#send_textarea', text); await p.press('#send_textarea', 'Enter');
    await p.waitForFunction(n => document.querySelectorAll('#chat .mes').length >= n + 2 && !document.querySelector('#send_but')?.classList.contains('displayNone'), before, { timeout: 90000 }).catch(() => console.log('TIMEOUT ' + text));
    await p.waitForTimeout(wait);
}
export const toasts = p => p.evaluate(() => [...document.querySelectorAll('#toast-container .toast')].map(t => t.innerText.slice(0, 300)));
export const q = (p, name, args = {}) => p.evaluate(([n, a]) => { try { return StoryBlock.sdk.query(n, a); } catch (e) { return 'err ' + e.message; } }, [name, args]);
