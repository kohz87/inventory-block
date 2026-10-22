// node ev.mjs <file.js | -e code> : evaluates an async function body in page; prints JSON
import fs from 'node:fs';
import { attach } from './cdp.mjs';
const a = process.argv.slice(2);
const code = a[0] === '-e' ? a[1] : fs.readFileSync(a[0], 'utf8');
const p = await attach();
try { const v = await p.evaluate(`(async () => { ${code} })()`); console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 1)); } catch (e) { console.log('ERR', e.message.slice(0, 2000)); }
p.close();
