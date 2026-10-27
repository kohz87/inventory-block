import { launch, ev, q } from './lib.mjs';
import { connect, openChat } from './create.mjs';
const { browser, page, errors } = await launch();
await connect(page); await openChat(page);
for (const a of process.argv.slice(2)) {
  const [name, args] = a.split('@'); 
  console.log('## ' + name, JSON.stringify(await q(page, name, args ? JSON.parse(args) : {}), null, 1)?.slice(0, 9000));
}
console.log('errors', JSON.stringify(errors));
await browser.close();
