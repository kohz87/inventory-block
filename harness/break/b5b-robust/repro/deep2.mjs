import { compileTemplate } from '../Story_block/src/v2/view/template/index.js';
import { parseHtml } from '../Story_block/src/v2/view/template/html.js';
import { scopeCss } from '../Story_block/src/v2/view/css.js';
for (const n of [100, 200, 300, 500, 700]) {
  const html = '<div>'.repeat(n) + 'x';
  let r; try { compileTemplate(html); r = 'ok'; } catch (e) { r = e.message + '\n' + e.stack.split('\n').slice(1, 8).join('\n'); }
  console.log(n, r.slice(0, 900));
}
try { parseHtml('<div>'.repeat(1000)); console.log('parse ok'); } catch (e) { console.log('parse throws'); }
for (const n of [250, 500, 1000, 2000, 2600]) {
  const css = '@media (min-width: 1px) {'.repeat(n) + '.a{color:red}' + '}'.repeat(n);
  const t = Date.now(); scopeCss(css, 'x.y'); console.log('css', n, css.length, Date.now() - t, 'ms');
}
