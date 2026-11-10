import { started } from '../Story_block/tests/v2/break/r1orig/helpers/suite-b5b.js';
import { installFakeDom } from '../Story_block/tests/ui-fake-dom.js';
import { createScreenRenderer } from '../Story_block/src/v2/view/render-screen.js';
const host = await started();
const places = host.sdk.query('atlas.places');
for (const depth of [2, 3]) {
  let html = 'x'; for (let d = depth - 1; d >= 0; d--) html = `<i data-each="q.p as ${'abc'[d]}">${html}</i>`;
  const doc = installFakeDom(); const el = doc.createElement('div');
  const t = Date.now();
  createScreenRenderer({ queryAt: () => null }).render(el, { id: 'fan-board', template: html }, { state: host.head(), q: { p: places }, mount: 'tab', screenId: 'fan-board', api: {} });
  console.log(depth, html.length, 'bytes', Date.now() - t, 'ms', el.querySelectorAll('i').length, 'elements');
}
host.close();
