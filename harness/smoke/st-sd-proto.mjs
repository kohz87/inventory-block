import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const OUT = `${S}/uiux/proto`;
const CHAT = 'The Narrator - 2026-10-18@13h00m00s000ms';
const r4 = fs.readFileSync(`${S}/demo/r4.txt`, 'utf8').replace(/<XP>[\s\S]*?<\/XP>\n?/, '');
const withLines = (time, extra) => r4.replace('1203, March 3, 09:50 am', time).replace('</Director>', `${extra}\n</Director>`);
const devices = [
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
  { name: 'tablet', width: 820, height: 1180, mobile: true },
  { name: 'tablet-landscape', width: 1180, height: 820, mobile: true },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];
let first = false;
for (const device of devices) {
  const h = await open({ width: device.width, height: device.height, mobile: device.mobile });
  const { page, ev } = h;
  await h.openNarrator(CHAT);
  if (first) {
    await h.turn(withLines('1203, March 3, 10:00 am', "+ quest Wolf Ears for Kael — Bring the pack's ears to Captain Kael | type: bounty | giver: Captain Kael | reward: 4 silver | step: ears in the sack\n+ hook Weir Eels — Clear the eels fouling the weir | giver: Lyra | reward: 3 silver\n+ hook Ferry Toll Dispute — Settle the ferryman's toll quarrel | giver: Mira | reward: 2 silver\n+ event Market Day — the Harrowford market opens | on: 1203, March 3, 11:00 am"), "I'll take Kael's bounty for the ears.");
    await page.waitForTimeout(2500);
    first = false;
  }
  const docked = await ev(() => document.querySelector('#story_block_sidebar')?.dataset.mode);
  const openSidebar = async () => {
    if (!device.mobile) { await h.dock(); return; }
    if (!(await ev(() => document.querySelector('#story_block_sidebar')?.classList.contains('is-open') || document.querySelector('#story_block_sidebar')?.dataset.mode === 'docked'))) {
      await page.locator('#story_block_handle').tap().catch(() => {}); await page.waitForTimeout(600);
    }
  };
  await openSidebar();
  const expand = async () => { if (device.mobile) { await page.locator('.story-block-sidebar-grip').tap().catch(() => {}); await page.waitForTimeout(500); } };
  const tabId = 'ext:story-director-quests';
  await h.tab(tabId);
  await expand();
  const pick = async view => { await ev(v => document.querySelector(`.story-director-view[data-view="${v}"]`)?.click(), view); await page.waitForTimeout(600); };
  // Quests, with the offers open and one asking "take it anyway?" left closed: as a reader sees it.
  await pick('quests');
  await ev(() => { const d = document.querySelector('.story-director-fold.is-offered'); if (d && !d.open) { d.open = true; d.dispatchEvent(new Event('toggle')); } });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/proto-${device.name}-quests.png` });
  await pick('journal');
  await page.screenshot({ path: `${OUT}/proto-${device.name}-journal.png` });
  await pick('director');
  await ev(() => document.querySelector('.story-director-lock button, .story-director-reveal')?.click());
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/proto-${device.name}-director.png` });
  // The tab's badge while another tab is open: offers waiting + due/arriving.
  await pick('quests');
  await h.tab('block:inventory');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/proto-${device.name}-badge.png` });
  const info = await ev(() => {
    const tab = document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:story-director-quests"]');
    const nav = document.querySelector('.story-director-views');
    return { badge: tab?.textContent.replace(/\s+/g, ' ').trim(), tabs: [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.dataset.tabId).join(','), mode: document.querySelector('#story_block_sidebar')?.dataset.mode };
  });
  console.log(device.name, JSON.stringify(info), 'docked-before:', docked, 'errors:', h.errors.join(' | ') || 'none');
  await h.browser.close();
}
