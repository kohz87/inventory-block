import http from 'node:http';
import fs from 'node:fs';
const Q = process.argv[2], LOG = process.argv[3];
// Optional: only a request whose body holds this text gets a queued reply (argv[5]).
const NEED = process.argv[5] || '';
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
      fs.appendFileSync(`${LOG}/served.txt`, `${n} main=${main} len=${reply.length}\n`);
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
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id: 'x', object: 'chat.completion', model: 'mock-model', choices: [{ index: 0, message: { role: 'assistant', content: reply }, finish_reason: 'stop' }] }));
      return;
    }
    res.writeHead(404); res.end();
  });
}).listen(Number(process.argv[4] || 5099), '127.0.0.1');
