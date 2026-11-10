// Shared helpers: connect the mock API, open the narrator chat, make a character through the wizard.
export async function connect(p) {
    await p.evaluate(() => document.querySelector('#api_button_openai')?.click());
    await p.waitForTimeout(3000);
}
export async function openChat(p) {
    await p.evaluate(async () => SillyTavern.getContext().executeSlashCommandsWithOptions?.('/go Ersveil'));
    await p.waitForTimeout(4000);
}
export async function makeCharacter(p, log = () => {}) {
    const create = p.getByRole('button', { name: 'Create' }).first();
    if (!(await create.count())) { log('no Create button (character exists)'); return true; }
    await create.click();
    await p.waitForTimeout(2000);
    // A rules pack offered: Create opens Setup; pin it (a reply-bound pin), then Setup shows its own Create.
    const pin = p.getByRole('button', { name: /^Pin / });
    if (await pin.count() && await pin.first().isVisible()) {
        log(`pin: ${(await pin.first().innerText()).trim()}`);
        await pin.first().click();
        await p.waitForTimeout(3000);
        const view = p.getByRole('dialog', { name: 'Game view' });
        const again = (await view.count() ? view : p).getByRole('button', { name: /^\s*Create/ });
        const shown = [];
        for (let n = 0; n < await again.count(); n++) if (await again.nth(n).isVisible()) shown.push(n);
        log(`after pin, visible Create buttons: ${shown.length}`);
        if (shown.length) { await again.nth(shown[0]).click(); await p.waitForTimeout(2000); }
    }
    for (let i = 0; i < 12; i++) {
        const dlg = p.locator('dialog[open], [role=dialog]').filter({ hasText: 'New character' }).last();
        if (!(await dlg.count())) { log(`wizard closed after ${i} steps`); return true; }
        const buttons = await dlg.locator('button').allInnerTexts();
        log(`step ${i}: ${buttons.map(b => b.trim()).filter(Boolean).join(' | ').slice(0, 300)}`);
        // A pinned rules pack: the first step lists basic classes (a name, then its skills joined by " · ").
        const classes = dlg.locator('button').filter({ hasText: ' · ' });
        if (i === 0 && await classes.count() && await classes.first().isVisible()) { await classes.first().click(); await p.waitForTimeout(800); log('picked a class'); }
        const human = dlg.getByRole('button', { name: /Human/ });
        if (await human.count() && await human.first().isVisible()) { await human.first().click(); await p.waitForTimeout(800); log('picked Human'); }
        const plus = dlg.locator('button').filter({ hasText: /^\s*\+\s*$/ });
        if (await plus.count() >= 7 && await plus.first().isVisible()) {
            for (let k = 0; k < 10; k++) { await plus.nth(k % 7).click(); await p.waitForTimeout(120); }
            log('spent 10 points');
        }
        const finish = dlg.getByRole('button', { name: /^Create \S/ });
        if (await finish.count()) { await finish.last().click(); await p.waitForTimeout(3000); continue; }
        const next = dlg.getByRole('button', { name: /^Next$/ });
        if (await next.count()) { await next.last().click(); await p.waitForTimeout(1500); continue; }
        log('no Next/finish button'); return false;
    }
    return false;
}
