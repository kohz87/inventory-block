import fs from 'node:fs';
import { persist } from './lib.mjs';
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
console.log('before present', JSON.stringify(d.head.domains.scene.present));
d.chat.forEach((m, i) => { const r = persist.readRecord(m); if (!r) return; console.log(i, m.swipe_id, 'sid', r.sid, 'cp', !!r.checkpoint, r.checkpoint ? JSON.stringify(r.checkpoint.domains.scene.present) : '', JSON.stringify(r.ops.filter(o => o.path.includes('/scene/present'))), JSON.stringify(r.spans), JSON.stringify(r.receipts.map(x => x.type))); });
