import { scopeCss } from '../Story_block/src/v2/view/css.js';
import { unsafeCss } from '../Story_block/src/v2/packs/validate.js';
import { compileTemplate } from '../Story_block/src/v2/view/template/index.js';
const ms = fn => { const t = Date.now(); const r = fn(); return [Date.now() - t, r]; };
const cases = {
  nestedRules: n => '.a {'.repeat(n) + 'color:red' + '}'.repeat(n),
  nestedAmp: n => '& .a {'.repeat(n) + 'color:red' + '}'.repeat(n),
  supports: n => '@supports (display:grid) {'.repeat(n) + '.a{color:red}' + '}'.repeat(n),
  layerBlocks: n => '@layer a {'.repeat(n) + '.a{color:red}' + '}'.repeat(n),
  container: n => '@container (min-width: 1px) {'.repeat(n) + '.a{color:red}' + '}'.repeat(n),
  unclosedMedia: n => '@media (min-width:1px) {'.repeat(n) + '.a{color:red}',
  bracesInDecl: n => '.a { color: red; ' + '{'.repeat(n) + '}',
  manyRules: n => '.a{color:red}'.repeat(n),
  parenDepth: n => '.a { width: ' + 'calc('.repeat(n) + '1px' + ')'.repeat(n) + ' }',
  keyframesNested: n => '@media (min-width:1px){'.repeat(7) + '@keyframes k {' + '{'.repeat(n) + '}'.repeat(n) + '}' + '}'.repeat(7),
};
for (const [k, mk] of Object.entries(cases)) for (const n of [1000, 4000]) {
  const css = mk(n); if (css.length > 64 * 1024) continue;
  const [t1, out] = ms(() => scopeCss(css, 'x'));
  const [t2, why] = ms(() => unsafeCss(css));
  console.log(k.padEnd(16), n, css.length, 'scope', t1 + 'ms', 'out', out.css.length, 'warn', out.warnings.length, '| unsafe', t2 + 'ms', JSON.stringify(why || '').slice(0, 60));
}
const tcases = {
  svg: n => '<svg>' + '<g>'.repeat(n) + '</svg>',
  table: n => '<table><tr><td>'.repeat(n),
  lists: n => '<ul><li>'.repeat(n),
  select: n => '<select>' + '<optgroup>'.repeat(n),
  pAuto: n => '<p><b><i><span>'.repeat(n),
  widgetProps: n => `<ss-widget name="ss.badge" data-props='${'{"a":'.repeat(n)}1${'}'.repeat(n)}'></ss-widget>`,
  eachNest: n => '<i data-each="q.l as a">'.repeat(Math.min(n, 60)) + 'x',
  ifNest: n => '<i data-if="true">'.repeat(n),
};
for (const [k, mk] of Object.entries(tcases)) for (const n of [1000, 8000]) {
  const html = mk(n); if (html.length > 64 * 1024) continue;
  let r; const t = Date.now(); try { const c = compileTemplate(html); r = 'ok warnings=' + c.warnings.length + ' ' + (c.warnings[0] ?? '').slice(0, 60); } catch (e) { r = 'THROWS ' + e.message; }
  console.log(k.padEnd(12), n, html.length, Date.now() - t + 'ms', r);
}
