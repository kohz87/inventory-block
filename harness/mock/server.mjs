import http from 'node:http';
import fs from 'node:fs';
const LOG = process.argv[2];
let n = 0;
http.createServer((req, res) => {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    if (req.url.endsWith('/models')) { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ object: 'list', data: [{ id: 'mock-model', object: 'model' }] })); return; }
    if (req.url.endsWith('/chat/completions')) {
      n += 1;
      fs.writeFileSync(`${LOG}/req-${n}.json`, body);
      const reply = 'The rain keeps on over Auvoth.';
      const json = JSON.parse(body || '{}');
      if (json.stream) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.write(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: reply } }] })}\n\n`);
        res.end('data: [DONE]\n\n');
      } else {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ id: 'x', object: 'chat.completion', model: 'mock-model', choices: [{ index: 0, message: { role: 'assistant', content: reply }, finish_reason: 'stop' }] }));
      }
      return;
    }
    res.writeHead(404); res.end();
  });
}).listen(5099, '127.0.0.1');
