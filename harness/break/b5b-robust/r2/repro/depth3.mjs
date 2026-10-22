import { compileTemplate, renderTemplate } from '../Story_block/src/v2/view/template/index.js';
import { scopeCss } from '../Story_block/src/v2/view/css.js';
import { unsafeCss } from '../Story_block/src/v2/packs/validate.js';
import { installFakeDom } from '../Story_block/tests/ui-fake-dom.js';
import { standardWidgets } from '../Story_block/src/v2/view/widgets/index.js';
const depthOf = n => n.children?.length ? 1 + Math.max(...n.children.map(depthOf)) : 1;
for (const [k, html] of Object.entries({
  select: '<select>' + '<optgroup>'.repeat(3000),
  pAuto: '<p><b><i><span>'.repeat(3000),
  widgetProps: `<ss-widget name="ss.badge" data-props='${'{"a":'.repeat(8000)}1${'}'.repeat(8000)}'></ss-widget>`,
})) {
  const c = compileTemplate(html);
  const doc = installFakeDom(); const el = doc.createElement('div');
  let r = 'ok';
  try { renderTemplate(el, c, {}, { evaluate: () => true, widgets: standardWidgets }); } catch (e) { r = 'RENDER THROWS ' + e.message; }
  let d = 0; const walk = (n, dd) => { d = Math.max(d, dd); for (const ch of n.childNodes ?? []) walk(ch, dd + 1); }; walk(el, 0);
  console.log(k, 'warnings', c.warnings.length, r, 'dom depth', d);
}
for (const css of ['.a { .b { color: red } }', '.a { &:hover { color: red } }', '@media (min-width: 1px) { .a { .b { color: red } } }', '.a{'.repeat(9) + 'color:red' + '}'.repeat(9)]) {
  const out = scopeCss(css, 'x'); console.log(JSON.stringify(css).slice(0, 60), '=>', JSON.stringify(out.css).slice(0, 120), out.warnings, '| unsafe:', unsafeCss(css));
}
