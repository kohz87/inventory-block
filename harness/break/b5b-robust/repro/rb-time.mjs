import * as S from '../rpg_battle/src/story.js';
const SP = ' '.repeat(20000);
const cases = {
  parseWounds_cause: () => S.parseWounds(`Wessel — wound${SP}x`),
  parseWounds_name: () => S.parseWounds(`Wessel${SP}x — wound: fell`),
  parseEncounter_spaces: () => S.parseEncounter(`3 Wolf${SP}x`),
  parseEncounter_dots: () => S.parseEncounter(`3 Wolf${'.'.repeat(20000)}x`),
  parseEncounter_parens: () => S.parseEncounter(`3 Wolf ${'('.repeat(20000)}x`),
  parseEncounter_commas: () => S.parseEncounter(`3 Wolf${' ,'.repeat(10000)}x`),
  parseHints: () => S.parseHints(`taught by: Elke${SP}x`),
  parseJoins: () => S.parseJoins(`Brecht${SP}x — a guard | level: 2`),
  parseLearned: () => S.parseLearned(`Wessel — Slash${SP}x`),
};
for (const [k, fn] of Object.entries(cases)) { const t = Date.now(); try { fn(); } catch (e) { console.log(k, 'throws', e.message); } console.log(k.padEnd(24), Date.now() - t, 'ms'); }
