import fs from 'node:fs';
const A = '/home/user/cell/a3';
const { validatePack } = await import(`${A}/Story_block/src/v2/packs/validate.js`);
const base = () => JSON.parse(fs.readFileSync(`${A}/Story_block/examples/packs/ersveil-bluewatch/pack.json`, 'utf8'));
const cases = {
  needsUnknownMeter: p => { p.content.meterPresets[0].stages[0].needs = [{ meter: 'nope', at: 5 }]; },
  needsAtOutOfRange: p => { p.content.meterPresets[0].stages[0].needs = [{ meter: 'regard', at: 5000 }]; },
  dupMeterId: p => { const m = p.content.meterPresets[0].meters; m.push({ ...m[0] }); },
  bandsUnsorted: p => { p.content.meterPresets[0].meters[0].bands.reverse(); },
  bandAtOutside: p => { p.content.meterPresets[0].meters[0].bands[0].at = -5000; },
  driftHuge: p => { p.content.meterPresets[0].meters[1].drift = { toward: 0, perDay: 1e9 }; },
  driftTowardOutside: p => { p.content.meterPresets[0].meters[1].drift = { toward: 5000, perDay: 1 }; },
  reservedMeterId: p => { p.content.meterPresets[0].meters[0].id = 'stage'; },
  protoMeterId: p => { p.content.meterPresets[0].meters[0].id = '__proto__'; },
  startOutside: p => { p.content.meterPresets[0].meters[0].start = 101; },
  minEqMax: p => { Object.assign(p.content.meterPresets[0].meters[0], { min: 5, max: 5, start: 5 }); },
  markupDescribe: p => { p.content.meterPresets[0].meters[0].describe = '<img src=x onerror=alert(1)>'; },
  markupWord: p => { p.content.meterPresets[0].meters[0].bands[0].word = '<b>x</b>'; },
  craftStatsDup: p => { p.content.crafts[0].stats = ['INT', 'INT']; },
  craftStationBad: p => { p.content.crafts[0].stations = ['Forge!']; },
  craftNoteMarkup: p => { p.content.crafts[0].note = '<script>alert(1)</script>'; },
  craftIdDefaultReplaced: p => { p.content.crafts.push({ id: 'smithing', title: 'Smith', stats: ['LUK'] }); },
  recipeStatUnknown: p => { p.content.recipes[0].stat = 'FOO+BAR'; },
  recipeStatLower: p => { p.content.recipes[0].stat = 'str'; },
  economyNeg: p => { p.economy = { scale: -1 }; },
  economyStr: p => { p.economy = { scale: '8' }; },
  economyNoteMarkup: p => { p.economy = { scale: 8, note: '<img src=x onerror=alert(1)>' }; },
};
for (const [name, fn] of Object.entries(cases)) {
  const p = base(); fn(p);
  let r; try { r = validatePack(JSON.stringify(p)); } catch (e) { console.log(name, 'THREW', e.message); continue; }
  const mp = r.pack?.content?.meterPresets?.[0];
  console.log(name.padEnd(24), r.ok ? 'ACCEPTED' : 'refused', r.ok ? '' : (r.errors[0]?.code + ' ' + r.errors[0]?.message).slice(0, 110), r.ok && /markup/i.test(name) ? JSON.stringify(mp?.meters?.[0]?.describe ?? mp?.meters?.[0]?.bands?.[0]?.word ?? r.pack.content.crafts?.[0]?.note ?? r.pack.economy?.note).slice(0, 60) : '');
}
