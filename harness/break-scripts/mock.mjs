// b6-soak's mock model (a copy of scratchpad/mock/queue.mjs with two changes): only a story generation
// (its body holds NEED) takes a queued reply, and every other call (NSD's scanners) gets a small valid
// scanner answer instead of an empty reply, as a real model would give. served.txt names each call's kind.
import http from 'node:http';
import fs from 'node:fs';
const Q = process.argv[2], LOG = process.argv[3];
const NEED = process.argv[5] || '';
const SIDE = process.argv[6] ?? '{"npcs":[],"profileUpdates":[],"keyRelationshipEdges":[]}';
let n = 0;
http.createServer((req, res) => {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    if (req.url.endsWith('/models')) { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ object: 'list', data: [{ id: 'mock-model', object: 'model' }] })); return; }
    if (req.url.endsWith('/chat/completions')) {
      n += 1;
      fs.writeFileSync(`${LOG}/req-${n}.json`, body);
      const json = JSON.parse(body || '{}');
      const main = (json.messages ?? []).length >= 4 && (!NEED || body.includes(NEED));
      let reply = '';
      if (main) { const files = fs.readdirSync(Q).sort(); if (files.length) { reply = fs.readFileSync(`${Q}/${files[0]}`, 'utf8'); fs.unlinkSync(`${Q}/${files[0]}`); } }
      else reply = SIDE;
      const kind = main ? 'main' : String(json.messages?.[0]?.content ?? '').slice(0, 60).replace(/\s+/g, ' ');
      fs.appendFileSync(`${LOG}/served.txt`, `${n} main=${main} len=${reply.length} kind=${kind}\n`);
      if (json.stream) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        const parts = reply.match(/[\s\S]{1,200}/g) ?? [''];
        let i = 0;
        const tick = () => {
          if (i < parts.length) { res.write(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: parts[i++] } }] })}\n\n`); setTimeout(tick, 60); }
          else res.end('data: [DONE]\n\n');
        };
        tick();
        return;
      }
      // Side calls may be slowed down like a real model: a number of ms in <Q>/../side-delay.
      let delay = 0;
      try { delay = main ? 0 : Number(fs.readFileSync(`${Q}/../side-delay`, 'utf8')) || 0; } catch { delay = 0; }
      setTimeout(() => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ id: 'x', object: 'chat.completion', model: 'mock-model', choices: [{ index: 0, message: { role: 'assistant', content: reply }, finish_reason: 'stop' }] }));
      }, delay);
      return;
    }
    res.writeHead(404); res.end();
  });
}).listen(Number(process.argv[4] || 5099), '127.0.0.1');
