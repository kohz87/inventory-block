// background: attach and log every console error/warning and page exception to errors.log
import fs from 'node:fs';
import { attach } from './cdp.mjs';
const OUT = process.argv[2] ?? '/home/user/cell/out/a3/errors.log';
const p = await attach();
await p.send('Log.enable');
const log = s => fs.appendFileSync(OUT, `${new Date().toISOString().slice(11, 19)} ${s}\n`);
log('--- monitor attached');
p.on(m => {
  if (m.method === 'Runtime.exceptionThrown') { const d = m.params.exceptionDetails; log(`EXC ${(d.exception?.description ?? d.text).slice(0, 600)}`); }
  else if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'assert'].includes(m.params.type)) { log(`CON.${m.params.type} ${(m.params.args ?? []).map(a => a.value ?? a.description ?? '').join(' ').slice(0, 600)} @${m.params.stackTrace?.callFrames?.[0]?.url ?? ''}`); }
  else if (m.method === 'Log.entryAdded' && ['error', 'warning'].includes(m.params.entry.level)) { log(`LOG.${m.params.entry.level} ${m.params.entry.text.slice(0, 400)} ${m.params.entry.url ?? ''}`); }
  else if (m.method === 'Page.javascriptDialogOpening') { log(`DIALOG ${m.params.type} ${m.params.message.slice(0, 200)}`); p.send('Page.handleJavaScriptDialog', { accept: true, promptText: '' }).catch(() => {}); }
});
setInterval(() => {}, 1 << 30);
