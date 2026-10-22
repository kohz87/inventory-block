import { open, S } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
const mes = `<!-- STORY_BLOCKS_V1
<Blocks>
<World_State>
**📅 Time:** CY 611, Goldwane 12, 08:45 am | **🌤 Loc:** Bluewatch Village | Communal Sheepfold | **🌡 Wx:** Drizzle, 9°C

---

**🧍 Wessel:**
* *Outfit:* Patched oilcloth coat
* *Position:* Beside the handcart

---

**🎬 Scene Phase:** Midpoint Tension
</World_State>
Nelke rummaged beneath the counterboards, her head disappearing into the dark knee-hole before she came up red-faced with an iron-banded torch.

"He didn't leave much worth packing," she said, setting the items down with a dull clatter.
<CYOA>
1. Draw the concealed steel and strike the lead beast.
2. Tip the heavy handcart on its side.
</CYOA>
</Blocks>
-->`;
await h.turn(mes, 'I take the torch.');
await page.waitForTimeout(2500);
const saved = await ev(() => SillyTavern.getContext().chat.at(-1).mes);
console.log('saved starts:', JSON.stringify(saved.slice(0, 40)), '... ends:', JSON.stringify(saved.slice(-80)));
console.log('shown in chat:', await ev(() => document.querySelector('#chat .mes:last-child .mes_text')?.innerText.slice(0, 200)));
await h.tab('block:world-state'); await page.waitForTimeout(600);
console.log('world tab:', (await h.pane()).slice(0, 120));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
