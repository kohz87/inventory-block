// UI probes shared by the matrix scripts.
export async function openChat(page, chat) {
    await page.evaluate(async main => { const ctx = SillyTavern.getContext(); if (ctx.getCurrentChatId() !== main) { if (ctx.characters[ctx.characterId]?.name !== 'The Narrator') { await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator'))); await new Promise(r => setTimeout(r, 1500)); } await ctx.openCharacterChat(main); await new Promise(r => setTimeout(r, 2500)); } }, chat);
}
const visible = 'n => { const r = n.getBoundingClientRect(); const s = getComputedStyle(n); return !n.hidden && s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0; }';
export async function setFeaturesViaOverlay(page, want) {
    await page.evaluate(() => document.querySelector('.story-suite-bar-settings')?.click());
    await page.waitForSelector('#story_suite_v2_overlay', { timeout: 5000 });
    const log = await page.evaluate(want => {
        const out = [];
        const fold = document.querySelector('#story_suite_v2_overlay details[data-fold="story-suite-features"]');
        if (fold) fold.open = true; else out.push('no Features fold');
        for (const [id, on] of Object.entries(want)) {
            const input = fold?.querySelector(`.story-suite-feature[data-feature="${id}"] input`);
            if (!input) { out.push(`no switch ${id}`); continue; }
            if (input.checked !== on) input.click();
        }
        return out;
    }, want);
    const state = await page.evaluate(() => [...document.querySelectorAll('#story_suite_v2_overlay .story-suite-feature')].map(n => `${n.dataset.feature}=${n.querySelector('input').checked}`));
    await page.evaluate(() => { const o = document.querySelector('#story_suite_v2_overlay'); const b = [...o.querySelectorAll('button')].find(x => /close/i.test(x.textContent + (x.title ?? '') + (x.getAttribute('aria-label') ?? ''))); b ? b.click() : o.remove(); });
    await page.waitForTimeout(400);
    return { log, state };
}
export async function probeSurfaces(page, { shotPrefix = null, shot = null } = {}) {
    const res = {};
    res.features = await page.evaluate(() => Object.fromEntries(StoryBlock.sdk.features().map(f => [f.id, f.on])));
    res.hud = await page.evaluate(v => { const vis = eval(v); return [...document.querySelectorAll('.ss-hud')].filter(vis).map(n => n.innerText.replace(/\s+/g, ' ').slice(0, 80)); }, visible);
    res.cards = await page.evaluate(v => { const vis = eval(v); return [...document.querySelectorAll('#chat .ss-card')].filter(vis).length; }, visible);
    res.notes = await page.evaluate(v => { const vis = eval(v); return [...document.querySelectorAll('#chat .story-suite-reply-note')].filter(vis).map(n => n.innerText.replace(/\s+/g, ' ').slice(0, 80)); }, visible);
    res.problems = [];
    // Story panel: every tab
    await page.evaluate(() => { const p = document.querySelector('#story_suite_v2_panel'); if (!p || p.hidden) document.querySelector('.story-suite-bar-story')?.click(); });
    await page.waitForTimeout(600);
    const tabs = await page.evaluate(() => [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')].map(b => b.textContent.trim()));
    res.tabs = {};
    for (const [i, name] of tabs.entries()) {
        await page.evaluate(i => document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')[i]?.click(), i);
        await page.waitForTimeout(500);
        const info = await page.evaluate(() => { const pane = document.querySelector('#story_suite_v2_panel .story-suite-pane'); return { len: (pane?.innerText ?? '').trim().length, problems: [...(pane?.querySelectorAll('.ss-mount-problem') ?? [])].map(n => n.textContent.slice(0, 160)), deadButtons: [...(pane?.querySelectorAll('button') ?? [])].filter(b => !b.disabled && !b.onclick && !b.dataset.command && !b.dataset.action && !b.closest('[data-bind]') && !b.type).length }; });
        res.tabs[name] = info.len;
        if (info.len < 3) res.problems.push(`tab ${name} blank`);
        for (const p of info.problems) res.problems.push(`tab ${name}: ${p}`);
        if (shot && shotPrefix && i < 12) await shot(page, `${shotPrefix}-tab-${String(i).padStart(2, '0')}`);
    }
    await page.evaluate(() => document.querySelector('#story_suite_v2_panel .story-suite-sheet-close')?.click());
    // Game view: every screen
    const hasGame = await page.evaluate(() => { const b = document.querySelector('.story-suite-bar-game'); if (b && !b.hidden) { b.click(); return true; } return false; });
    res.game = {};
    if (hasGame) {
        await page.waitForTimeout(700);
        const items = await page.evaluate(() => [...document.querySelectorAll('.ss-gameview-navitem')].map(b => b.textContent.trim()));
        for (const [i, name] of items.entries()) {
            await page.evaluate(i => document.querySelectorAll('.ss-gameview-navitem')[i]?.click(), i);
            await page.waitForTimeout(500);
            const info = await page.evaluate(() => { const m = document.querySelector('.ss-gameview-main, .ss-gameview-body'); return { len: (m?.innerText ?? '').trim().length, problems: [...(m?.querySelectorAll('.ss-mount-problem') ?? [])].map(n => n.textContent.slice(0, 160)) }; });
            res.game[name] = info.len;
            if (info.len < 3) res.problems.push(`game ${name} blank`);
            for (const p of info.problems) res.problems.push(`game ${name}: ${p}`);
        }
        await page.evaluate(() => document.querySelector('.ss-gameview-close')?.click());
        await page.waitForTimeout(300);
    }
    res.xss = await page.evaluate(() => window.__xss ?? window.xss ?? null);
    res.rawMarkup = await page.evaluate(() => [...document.querySelectorAll('#story_suite_v2_panel b, .ss-gameview b, .ss-hud b, .ss-card b')].filter(b => b.textContent === 'Bold').length);
    return res;
}
