import { open, S } from './demo-common.mjs';
const OUT = `${S}/uiux/rows`;
const shots = [
  { name: 'desktop-docked', width: 1440, height: 1000 },
  { name: 'tablet-portrait', width: 820, height: 1180 },
  { name: 'tablet-landscape', width: 1180, height: 820 },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];
const only = process.argv[2];
for (const shot of shots.filter(s => !only || s.name === only)) {
  const h = await open({ width: shot.width, height: shot.height, mobile: Boolean(shot.mobile) });
  const { page, ev } = h;
  await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
  await page.waitForTimeout(1500);
  if (shot.width >= 1000) await h.dock();
  else {
    await page.locator('#story_block_handle').click().catch(() => {});
    await page.waitForTimeout(800);
  }
  const info = await ev(() => {
    const strip = document.querySelector('.story-block-sidebar-tabs');
    const tabs = [...strip.querySelectorAll('.story-block-sidebar-tab')];
    return {
      mode: document.querySelector('#story_block_sidebar')?.dataset.mode,
      fit: strip.getAttribute('data-fit'),
      width: strip.clientWidth, scroll: strip.scrollWidth, height: strip.offsetHeight,
      tabs: tabs.map(t => `${t.querySelector('.story-block-sidebar-tab-glyph').textContent}${t.classList.contains('is-group-start') ? '|' : ''}:${t.title}${t.querySelector('.story-block-sidebar-badge').textContent ? '(' + t.querySelector('.story-block-sidebar-badge').textContent + ')' : ''}`).join(' '),
      rows: new Set(tabs.map(t => t.offsetTop)).size,
    };
  });
  console.log(shot.name, JSON.stringify(info));
  await page.screenshot({ path: `${OUT}/rows-${shot.name}.png` });
  if (shot.name === 'desktop-docked') {
    // The label bubble on hover in icon mode.
    await page.locator('.story-block-sidebar-tab').nth(3).hover();
    await page.waitForTimeout(300);
    console.log('tip:', await ev(() => { const t = document.querySelector('.story-block-sidebar-tab-tip'); return t.style.display === 'none' ? 'hidden' : t.textContent; }));
    await page.screenshot({ path: `${OUT}/rows-desktop-hover.png` });
  }
  console.log('errors:', h.errors.join('\n') || 'none');
  await h.browser.close();
}
