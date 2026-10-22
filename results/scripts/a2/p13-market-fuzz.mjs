// a2 probe 13: fuzz marketAt/goodsFactor with hostile pack/lorebook market records: factors finite, env within ±30 %.
import { marketAt, goodsFactor, ENV_CAP, CATEGORIES } from '/home/user/cell/a2/rpg_battle/src/v2/trade/markets.js';
import { readMarketLine } from '/home/user/cell/a2/Story_block/src/v2/packs/lorebook.js';
let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = a => a[Math.floor(rnd() * a.length)];
const vals = [0, -1, 0.25, 0.24, 4, 4.01, NaN, Infinity, '2', null, 1e9, 1.3, 0.7, 3.99];
const tags = ['coastal', 'river', 'port', 'mountain', 'mining', 'forest', 'desert', 'farmland', 'frontier', 'swamp', 'toll', '__proto__', 'constructor', 'all', 'x'];
const types = ['camp', 'outpost', 'hamlet', 'village', 'town', 'city', 'capital', 'lock-town', '__proto__', 'toString', 'hasOwnProperty'];
let bad = 0, runs = 0;
for (let i = 0; i < 20000; i++) {
  const markets = {
    types: Array.from({ length: 3 }, () => ({ type: pick(types), buy: pick(vals), sell: pick(vals), stock: pick([[1, 2], [-5, 1e9], [NaN, 2], 'x', [3]]) })),
    tags: Array.from({ length: 3 }, () => ({ tag: pick(tags), prices: Object.fromEntries(Array.from({ length: 3 }, () => [pick([...CATEGORIES, 'all', '__proto__']), pick(vals)])) })),
    places: [{ place: 'Here', aliases: [], type: pick(types), tags: Array.from({ length: 10 }, () => pick(tags)), from: pick(['lorebook', 'pack']), buy: pick(vals), sell: pick(vals) }],
  };
  let m;
  try { m = marketAt({ name: pick(['Here', 'here ', 'HERE|x', 'There']), kind: pick([...types, 'port', 'royal-city', '']) }, { markets, places: [] }); } catch (e) { bad++; if (bad < 4) console.log('throw', e.message); continue; }
  runs++;
  const fin = x => typeof x === 'number' && Number.isFinite(x) && x > 0;
  if (!fin(m.buy) || !fin(m.sell) || !Array.isArray(m.stock) || !m.stock.every(n => Number.isInteger(n) && n >= 0 && n <= 20)) { bad++; if (bad < 8) console.log('bad market', JSON.stringify({ buy: m.buy, sell: m.sell, stock: m.stock, type: m.type })); }
  for (const c of [...CATEGORIES, null]) {
    const f = goodsFactor({ name: c ?? 'thing', tags: c ? [c] : [] }, m);
    if (!(f >= 1 - ENV_CAP - 1e-9 && f <= 1 + ENV_CAP + 1e-9)) { bad++; if (bad < 8) console.log('env', c, f); }
  }
}
console.log('runs', runs, 'bad', bad);
for (const l of ['market: capital; desert; sell 4, buy 0.25', 'market: __proto__', 'market: toString; coastal', 'market: town; ; sell 4.0000', 'market: town;;buy 0.25;sell 4']) console.log(l, JSON.stringify(readMarketLine(l)));
