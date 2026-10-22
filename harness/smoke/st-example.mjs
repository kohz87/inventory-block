import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const EXAMPLE = `<Skill_Mastery>
Soul Class: [I-IX] | Soul Growth: [0.00-99.99]/100 | Spirit Class: [I-IX] | Spirit Growth: [0.00-99.99]/100 | Soul Strain: [0-100]%

Spirit: Stage: [Unseen/Young Adult/Adult/True Form] | Next Spirit Stage: [Stage] | Requires: Spirit Class [numeral]

Weapon Skill: [1-10]/10 | Weapon Skill XP: [0.00-9.99]/10 | Finesse: [1-10]/10 | Finesse XP: [0.00-9.99]/10

Last Gains: [engagement or beat: Soul Growth: +x [base, share, split, res] | Skill XP: +x [base, res] ... / none: why no beat qualified]

[Add newly established skills in the same Skill | Skill XP pairing, two skills per line. At Soul Class IX use Soul Growth: MAX. Use hyphens, not parentheses.]
</Skill_Mastery>`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
page.on('pageerror', e => console.log('pageerror', e.message));
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1, null, { timeout: 60000 });
await page.waitForTimeout(1500);
await page.locator('#extensions-settings-button .drawer-icon').first().tap();
await page.waitForTimeout(800);
await page.evaluate(() => document.querySelector('.story-block-settings .inline-drawer-toggle').click());
await page.waitForTimeout(600);
await page.evaluate(() => document.querySelector('.story-block-add')?.click());
await page.evaluate(() => document.querySelector('.story-block-add-option[data-template="example"]')?.click());
await page.waitForTimeout(300);
await page.fill('.story-block-example-text', EXAMPLE);
await page.evaluate(() => document.querySelector('.story-block-example-text')?.scrollIntoView());
await page.screenshot({ path: `${S}/shots/sb-example-paste.png` });
await page.evaluate(() => document.querySelector('.story-block-example-apply')?.click());
await page.waitForTimeout(400);
const form = await page.evaluate(() => ({ name: document.querySelector('.story-block-input-name')?.value, tag: document.querySelector('.story-block-input-tag')?.value, kind: document.querySelector('.story-block-input-kind')?.value, format: document.querySelector('.story-block-input-format')?.value, display: document.querySelector('.story-block-input-display')?.value, prompt: document.querySelector('.story-block-input-prompt')?.value, layoutLines: document.querySelector('.story-block-input-layout')?.value.split('\n').length, layoutVisible: !document.querySelector('.story-block-editor-layout')?.hidden }));
console.log('form:', JSON.stringify(form, null, 1));
await page.evaluate(() => document.querySelector('.story-block-editor')?.scrollIntoView());
await page.screenshot({ path: `${S}/shots/sb-example-form.png` });
await page.evaluate(() => document.querySelector('.story-block-editor-save')?.click());
await page.waitForTimeout(500);
const saved = await page.evaluate(() => { const b = SillyTavern.getContext().extensionSettings.storyBlock.blocks.find(x => x.tag === 'Skill_Mastery'); return b && { id: b.id, enabled: b.enabled, kind: b.kind, format: b.format, display: b.display }; });
console.log('saved:', JSON.stringify(saved));
// What the model will be told.
const prompt = await page.evaluate(async () => { const ctx = SillyTavern.getContext(); const p = window.StoryBlock?.promptPreview?.() ?? null; return p; });
console.log('preview available:', prompt !== null);
// Clean up: remove the test block.
await page.evaluate(() => { const ctx = SillyTavern.getContext(); ctx.extensionSettings.storyBlock.blocks = ctx.extensionSettings.storyBlock.blocks.filter(b => b.tag !== 'Skill_Mastery'); ctx.saveSettingsDebounced(); });
await browser.close();
