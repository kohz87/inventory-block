import { createRequire } from 'node:module';
export const { chromium } = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');
export const URL = 'http://127.0.0.1:8155/';
export const SHOTS = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/u7';
export async function boot(viewport) {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e?.stack ?? e).slice(0, 400)));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => globalThis.StoryBlock?.sdk && document.querySelector('#send_textarea'), null, { timeout: 120000 });
    await page.waitForTimeout(4000);
    await page.evaluate(async () => SillyTavern.getContext().executeSlashCommandsWithOptions?.('/go Ersveil'));
    await page.waitForTimeout(5000);
    return { browser, page, errors };
}
export async function gameview(page, tab) {
    if (await page.locator('.ss-gameview').count()) { await page.keyboard.press('Escape'); await page.waitForTimeout(700); }
    await page.locator('#story_suite_v2_bar').getByText('Game view', { exact: true }).first().click();
    await page.waitForTimeout(2000);
    if (tab && tab !== 'Home') {
        const item = page.locator('.ss-gameview .ss-screenbar-item', { hasText: tab }).first();
        if (await item.count() && await item.isVisible()) await item.click();
        else { await page.locator('.ss-gameview .ss-screenbar-item', { hasText: 'More' }).first().click(); await page.waitForTimeout(800); await page.getByText(tab, { exact: true }).last().click(); }
        await page.waitForTimeout(1500);
    }
}
