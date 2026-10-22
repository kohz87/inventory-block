// ---- UI audit ---------------------------------------------------------------------------------------
// Runs in page: overflow, blank controls, and (optional) forbidden words in the suite UI.
export function auditFn(opts) {
  const vis = e => { if (!e || !e.isConnected) return false; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const roots = ['#story_suite_v2_bar', '#story_suite_v2_panel', '.ss-gameview', '#story_suite_v2_overlay', '.ss-dialog', '.story-suite-hud', '#chat .mes [class*="story-suite"]', '#chat .mes [class*="ss-"]', '[class*="rpg-"]', '[class*="nsd"]', '[class*="sd-"]'];
  const els = new Set();
  for (const r of roots) for (const e of document.querySelectorAll(r)) if (vis(e)) els.add(e);
  const iw = innerWidth;
  const over = document.scrollingElement.scrollWidth > iw;
  const offenders = [];
  const blanks = [];
  const words = [];
  const desc = e => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${[...e.classList].slice(0, 3).join('.')}`;
  const seen = new Set();
  for (const root of els) {
    for (const e of [root, ...root.querySelectorAll('*')]) {
      if (seen.has(e)) continue; seen.add(e);
      if (!vis(e)) continue;
      const r = e.getBoundingClientRect();
      // past the right edge and not inside a sideways scroller
      if (r.right > iw + 1 && r.left < iw) {
        let a = e.parentElement, clipped = false;
        while (a) { const s = getComputedStyle(a); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) { const ar = a.getBoundingClientRect(); if (ar.right <= iw + 1) { clipped = true; break; } } a = a.parentElement; }
        if (!clipped) offenders.push(`${desc(e)} right=${Math.round(r.right)} w=${Math.round(r.width)} "${(e.textContent || '').trim().slice(0, 30)}"`);
      }
      if (e.matches('button, [role=button], a.menu_button, .menu_button, select, input:not([type=hidden])')) {
        const label = (e.textContent || '').trim() || (e.labels && e.labels.length ? 'lbl' : '') || e.closest('label')?.textContent?.trim() || e.getAttribute('aria-label') || e.title || e.value || e.placeholder || (e.querySelector('i[class*="fa-"]') ? 'icon:' + e.querySelector('i').className : '');
        if (!label) blanks.push(desc(e));
        if (r.width < 8 || r.height < 8) blanks.push(`${desc(e)} tiny ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    if (opts?.forbid) { const t = root.innerText || ''; const m = t.match(new RegExp(opts.forbid, 'gi')); if (m) for (const w of m) { const i = t.search(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))); words.push(`${desc(root)}: …${t.slice(Math.max(0, i - 40), i + 40).replace(/\s+/g, ' ')}…`); } }
  }
  return { iw, sw: document.scrollingElement.scrollWidth, over, offenders: [...new Set(offenders)].slice(0, 12), blanks: [...new Set(blanks)].slice(0, 20), words: [...new Set(words)].slice(0, 20) };
}


// Click each visible, non-destructive button under rootSel; report buttons after which nothing in the DOM changed.
export function clickAllFn({ rootSel, skip, max = 60 }) {
  return (async () => {
    const W = ms => new Promise(r => setTimeout(r, ms));
    const vis = e => { if (!e || !e.isConnected) return false; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const root = document.querySelector(rootSel);
    if (!root) return { error: 'no root ' + rootSel };
    const skipRe = new RegExp(skip, 'i');
    const label = b => ((b.textContent || '').trim() || b.getAttribute('aria-label') || b.title || '').replace(/\s+/g, ' ').slice(0, 50);
    const done = new Set(); const dead = []; const clicked = []; const errs = [];
    for (let k = 0; k < max; k++) {
      const all = [...root.querySelectorAll('button, [role=button], .menu_button, summary')].filter(vis);
      const b = all.find(x => !done.has(label(x) + '|' + x.className) && !skipRe.test(label(x)) && !x.disabled && x.getAttribute('aria-disabled') !== 'true');
      if (!b) break;
      const key = label(b) + '|' + b.className; done.add(key);
      let muts = 0; const mo = new MutationObserver(l => { muts += l.length; }); mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
      const dlgBefore = document.querySelectorAll('.ss-dialog, dialog[open], .popup').length;
      try { b.click(); } catch (e) { errs.push(`${key}: ${e.message}`); }
      await W(700); mo.disconnect();
      const dlgAfter = document.querySelectorAll('.ss-dialog, dialog[open], .popup').length;
      clicked.push(label(b));
      if (muts === 0 && dlgAfter === dlgBefore) dead.push(`${label(b)} <${b.tagName.toLowerCase()}.${[...b.classList].slice(0, 3).join('.')}>`);
      // close what opened
      if (dlgAfter > dlgBefore) { const c = [...document.querySelectorAll('.ss-dialog .ss-dialog-close, .ss-dialog [class*=cancel], dialog[open] .popup-button-cancel')].filter(vis).at(-1); c?.click(); await W(400); }
      if (!root.isConnected || !vis(root)) break;
    }
    return { clicked, dead, errs };
  })();
}

export const audit = (page, opts = {}) => page.evaluate(auditFn, opts);
export const clickAll = (page, rootSel, skip = 'drop|remove|delete|reset|uninstall|import|export|download|save character|file|forget|close|×|clear|turn down|give up|abandon|rewind|return here|restore|go back|new chat|start over', max = 80) => page.evaluate(clickAllFn, { rootSel, skip, max });
