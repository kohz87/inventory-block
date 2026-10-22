// a3-1 (live, SillyTavern 1.19): templates go through SillyTavern's DOMPurify with PURIFY_CONFIG first.
// PURIFY_CONFIG sets ALLOWED_URI_REGEXP to /^(?:https:|data:image\/|#)/i. DOMPurify (3.x, ST ships 3.4.2)
// applies ALLOWED_URI_REGEXP to the VALUE of every allowed attribute that is not URI-safe (URI-safe by
// default: alt class for id label name pattern placeholder role summary title value style xmlns; data-*
// and aria-* skip the check). So type="radio", type="checkbox", maxlength="80", rows="2" ... are all
// dropped: live, every checkbox/radio in a template is a text box (RPG Battle's race and talent pickers,
// Story Block's loot picks and "Equipped only"), and with no pack a character can never be made
// ("Choose a race." forever; the story is held). The testkit has no DOMPurify, so no test saw it.
// `purifyAttr` below is DOMPurify 3.4.2's _isValidAttribute value rule for an allowed attribute, verbatim
// in effect (node_modules/dompurify/dist/purify.es.mjs:1089-1118).
import test from 'node:test';
import assert from 'node:assert/strict';
import { PURIFY_CONFIG, compileTemplate } from '../../../src/v2/view/template/index.js';

const URI_SAFE = new Set(['alt', 'class', 'for', 'id', 'label', 'name', 'pattern', 'placeholder', 'role', 'summary', 'title', 'value', 'style', 'xmlns']);
const ATTR_WHITESPACE = /\s/g; // DOMPurify strips whitespace and controls before the test
function purifyAttr(name, value, cfg) {
    if (cfg.FORBID_ATTR?.includes(name)) return false;
    if (cfg.ALLOW_DATA_ATTR && /^data-[-\w.]+$/.test(name)) return true;
    if (/^aria-[\-\w]+$/.test(name)) return true;
    const uriSafe = new Set([...URI_SAFE, ...(cfg.ADD_URI_SAFE_ATTR ?? [])]);
    if (uriSafe.has(name)) return true;
    const re = cfg.ALLOWED_URI_REGEXP ?? /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
    if (re.test(String(value).replace(ATTR_WHITESPACE, ''))) return true;
    return !value;
}
// A stand-in for DOMPurify.sanitize(html, cfg) that only applies the attribute rule above.
const fakePurify = (html, cfg) => html.replace(/<([a-z][\w-]*)((?:\s+[\w:-]+(?:="[^"]*")?)*)\s*(\/?)>/gi, (_, tag, attrs, slash) => {
    const kept = [...attrs.matchAll(/\s+([\w:-]+)(?:="([^"]*)")?/g)].filter(([, n, v]) => purifyAttr(n.toLowerCase(), v ?? '', cfg)).map(m => m[0]).join('');
    return `<${tag}${kept}${slash ? ' /' : ''}>`;
});

test('a3-1: SillyTavern\'s DOMPurify with PURIFY_CONFIG keeps type="checkbox"/"radio" and maxlength', () => {
    const tpl = '<label class="check"><input type="checkbox" data-draft="equippedOnly"> Equipped only</label>'
        + '<label class="cc-card"><input type="radio" name="cc-race" data-draft="race" value="human"> Human</label>'
        + '<input data-draft="name" maxlength="80"><textarea data-draft="note" rows="2"></textarea>';
    const out = fakePurify(tpl, { ...PURIFY_CONFIG });
    assert.match(out, /type="checkbox"/, `type="checkbox" is dropped: ${out}`);
    assert.match(out, /type="radio"/, `type="radio" is dropped: ${out}`);
    assert.match(out, /maxlength="80"/, `maxlength is dropped: ${out}`);
    // And through Story Block's own compile step as ui-host.js calls it (sanitize = DOMPurify.sanitize):
    const compiled = compileTemplate(tpl, { sanitize: fakePurify });
    const json = JSON.stringify(compiled.nodes);
    assert.match(json, /checkbox/, 'the compiled template has no checkbox left');
    assert.match(json, /radio/, 'the compiled template has no radio left');
});
