const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const p = await b.newPage();
  await p.addScriptTag({ path: '/home/user/inventory-block/harness/st/app/node_modules/dompurify/dist/purify.min.js' });
  const out = await p.evaluate(() => {
    const html = '<input type="checkbox"><input type="radio" name="r" value="h"><input maxlength="80"><textarea rows="2"></textarea>';
    return [DOMPurify.sanitize(html, { ALLOWED_URI_REGEXP: /^(?:https:|data:image\/|#)/i }), DOMPurify.sanitize(html)];
  });
  console.log(out.join('\n')); await b.close();
})();
