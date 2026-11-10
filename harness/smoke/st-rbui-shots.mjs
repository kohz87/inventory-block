import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const out = `${S}/uiux/rb-after`; fs.mkdirSync(out, { recursive: true });
const devices = [['desktop', 1440, 1000, false], ['tablet', 820, 1180, true], ['mobile', 390, 844, true]];
const r3 = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace('Waterskin | 1 | Half full', 'Waterskin | 1 | Half full\n\n[Loot]\nBrood-Mother Skull | 1 | uncommon material · MDEF\nWolf-fang Charm | 1 | rare · LUK +3, holy');
for (const [name, width, height, mobile] of devices) {
  const D = `${process.env.ST_DATA}/default-user/chats/The Narrator`;
  fs.copyFileSync(`${D}/The Narrator - 2026-10-18@01h44m00s947ms.jsonl`, `${D}/The Narrator - 2026-10-18@09h00m00s000ms.jsonl`);
  const h = await open({ width, height, mobile });
  const { page, ev } = h;
  await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
  await page.waitForTimeout(1200);
  if (name === 'desktop') await h.dock();
  else { await page.locator('#story_block_handle').click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(1000); }
  await h.turn(r3, 'We head to the weir.'); await page.waitForTimeout(2500);
  if (name !== 'desktop' && !(await ev(() => document.querySelector('#story_block_sidebar')?.classList.contains('is-open') || document.querySelector('.story-block-sidebar-tab')?.offsetParent))) { await page.locator('#story_block_handle').click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(1000); }
  await h.tab('ext:rpg-party'); await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/rb-${name}-party.png` });
  await h.click('^Trade$|Trade'); await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/rb-${name}-trade.png` });
  await h.tab('ext:rpg-battle'); await h.click('^Fight'); await page.waitForTimeout(2500); await h.click('^Start'); await page.waitForTimeout(2000);
  await page.screenshot({ path: `${out}/rb-${name}-fight.png` });
  const icons = await ev(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => `${t.dataset.tabId}:${t.textContent.trim().slice(0, 12)}`).join(' | '));
  console.log(name, 'tabs:', icons, '· errors:', h.errors.join(' / ') || 'none');
  await h.browser.close();
}
