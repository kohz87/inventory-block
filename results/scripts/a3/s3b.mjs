import * as D from './drv.mjs';
const p = await D.page();
for (const w of [390, 1440]) {
  await D.size(p, w);
  // wizard race step, in a fresh chat (no character yet)
  await D.openChar(p, 'The Narrator', true);
  await p.ev(async () => { const W = ms => new Promise(r => setTimeout(r, ms)); document.querySelector('.story-suite-bar-game').click(); await W(800); document.querySelector('.sb-ready-go')?.click(); await W(1000); document.querySelector('.ss-dialog-next')?.click(); await W(600); });
  console.log(w, 'race step', JSON.stringify(await D.audit(p)));
  console.log(w, 'dialog scroll', JSON.stringify(await p.ev(() => { const b = document.querySelector('.ss-dialog-body'); const d = document.querySelector('.ss-dialog'); return { bodySW: b?.scrollWidth, bodyCW: b?.clientWidth, dlgW: d?.getBoundingClientRect().width }; })));
  await p.shot(`${D.OUT}/shots/s3-race-${w}.jpg`, 45);
  await p.ev(async () => { const W = ms => new Promise(r => setTimeout(r, ms)); document.querySelector('.ss-dialog-next')?.click(); await W(500); });
  console.log(w, 'talents', JSON.stringify(await p.ev(() => [...document.querySelectorAll('.ss-dialog-body input')].map(i => i.type).join(','))));
  await p.shot(`${D.OUT}/shots/s3-talents-${w}.jpg`, 45);
  await p.ev(() => { document.querySelector('.ss-dialog .ss-dialog-close')?.click(); document.querySelector('.ss-gameview-close')?.click(); });
}
p.close();
