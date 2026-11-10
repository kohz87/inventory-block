import { open } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
const r = await h.ev(async () => { const { promptManager } = await import('/scripts/openai.js'); const e = promptManager.getPromptOrderEntry(promptManager.activeCharacter, 'main'); const was = e?.enabled; if (e) e.enabled = true; await promptManager.saveServiceSettings?.(); SillyTavern.getContext().saveSettingsDebounced?.(); await new Promise(res => setTimeout(res, 2000)); return { was, now: e?.enabled }; });
console.log('main prompt:', JSON.stringify(r));
await h.browser.close();
