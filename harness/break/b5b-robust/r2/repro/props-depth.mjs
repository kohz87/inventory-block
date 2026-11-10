import { compileTemplate, renderTemplate } from '../Story_block/src/v2/view/template/index.js';
import { installFakeDom } from '../Story_block/tests/ui-fake-dom.js';
import { standardWidgets } from '../Story_block/src/v2/view/widgets/index.js';
import { createHost } from '../Story_block/testkit/index.js';
for (const n of [100, 500, 1000, 2000, 4000]) {
  const html = `<ss-widget name="ss.badge" data-props='${'{"a":'.repeat(n)}1${'}'.repeat(n)}'></ss-widget>`;
  const doc = installFakeDom(); const el = doc.createElement('div'); const warns = [];
  let r = 'ok';
  try { renderTemplate(el, compileTemplate(html), {}, { evaluate: () => true, widgets: standardWidgets, onWarn: w => warns.push(w) }); } catch (e) { r = 'THROWS ' + e.message + ' @ ' + e.stack.split('\n')[1].trim(); }
  console.log(n, html.length, r, warns.slice(0, 1));
}
const n = 3000;
const pack = { id: 'deep-props', version: '1.0.0', name: 'D', requires: { storyBlock: '^2' }, content: {}, screens: [{ id: 'deep-props-board', title: 'B', mounts: ['tab'], template: `<ss-widget name="ss.badge" data-props='${'{"a":'.repeat(n)}1${'}'.repeat(n)}'></ss-widget>` }] };
const host = await createHost(); const res = await host.packs.packs.install(JSON.stringify(pack), { origin: 'pack.json' }); console.log('install', res.ok, JSON.stringify(res.errors ?? '').slice(0, 200)); host.close();
