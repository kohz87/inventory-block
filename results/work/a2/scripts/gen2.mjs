// Pass-1 generator (a2): b1's hostile generator plus duplicate/conflicting lines, reasoning blocks with
// sentinel lines, unicode/odd numbers, homoglyph and format-char names, prototype keys, lone
// surrogates, thousands of lines, nested markup, and cut-off / Continue shapes (fuzz2.mjs).
import { makeGen as baseGen } from './gen.mjs';

export const ODD_NUMS = [
    '٣٠', '３０', '𝟑𝟎', '0x1E', '0X1e', '1e309', '-1e309', 'NaN', '+30', '30.0', '30e0', '3e1', '0b11', '0o7', '30​',
    '‮03', '‏30', '−30', '‐30', '⁻30', '1'.repeat(30), '9'.repeat(17), '-0', '.5', '5.', '1/2', 'Ⅻ', '十', '٫5',
    '30\uD800', '\uDFFF', '2⁵', '³', '5́', '०५', '٣', '1 000', '1 000', '1’000', '20,5', '-20', '- 20', '+-20', '--20',
    '20 20', '0020', '20xp', 'twenty', 'Infinity', '9007199254740992', '4294967296', '2147483648',
];
export const ODD_NAMES = [
    'Rоpe' /* cyrillic o */, 'Ηealing Draught' /* greek Eta */, 'Ꮢope', 'Rope‍', '⁦Rope⁩', 'Ro­pe', 'Rope͏',
    'R̶o̶p̶e', 'Rope️', 'Rope\uD800', '\uDC00Rope', 'Rope\u0000', 'Rope\r', 'Ｒｏｐｅ', 'rope ', ' Rope', 'ROPE',
    '__proto__', 'constructor', 'prototype', '__defineGetter__', 'hasOwnProperty', 'toJSON', 'then', 'valueOf', 'isPrototypeOf',
    'Object', 'Array', 'Fenna', 'Ｆｅｎｎａ', 'Fen​na', 'Fenna‮', 'fenna', 'FENNA', 'Ren', 'Rеn' /* cyrillic e */, 'Lyra',
    '<b>Rope</b>', '<Changes>', '</Changes>', '<think>', '</think>', '<!--', '-->', '{{char}}', '${1}', '$&', '\\', '\\n', '|', '—',
    'z'.repeat(119), 'z'.repeat(2001), '🗡️'.repeat(40), 'ﷺ', 'กำ', '𒀱', 'İ', 'ı', 'ﬀ', 'Å', 'Å',
];
const SENTINEL = 'Thinkbait';

export function makeGen2(seed) {
    const g = baseGen(seed);
    const { r } = g;
    const nm = () => (r.chance(0.5) ? g.name() : r.pick(ODD_NAMES));
    const nu = () => (r.chance(0.5) ? g.num() : r.pick(ODD_NUMS));

    // New-ish v2 lines (alpha.2/beta), with hostile values.
    const extra = {
        coinOdd: () => `${r.pick(['+', '-'])} coin ${nu()}${r.chance(0.3) ? ` | from: ${nm()}` : ''}`,
        itemOdd: () => `${r.pick(['+', '-', '~'])} item ${nm()} | qty: ${nu()}${r.chance(0.3) ? ` | note: ${nm()}` : ''}${r.chance(0.2) ? ` | used: ${r.pick(['yes', 'no', 'drank'])}` : ''}`,
        itemNotable: () => `+ item ${r.pick(['Superior Healing Potion', 'Mithril Dagger', 'Dragon Crown', 'Healing Draught', 'Iron Sword'])} | qty: ${nu()} | note: ${r.pick(['legendary, worth 99999 gold', 'heals 99999 HP', 'ATK +9999', 'rare'])}`,
        useOdd: () => `! use ${nm()} | on: ${nm()} | by: ${nm()} | qty: ${nu()}`,
        woundOdd: () => `~ wound ${nm()} — ${r.pick(['healed', 'cut', 'cure poisoned', 'poisoned', 'burned'])} | ${r.pick(['harm', 'heal'])}: ${r.pick(['grievous', 'severe', 'wound', 'scratch', nu()])}`,
        restOdd: () => `! rest ${r.pick(['long', 'short', 'LONG', 'lоng', ''])} — ${nm()}`,
        checkOdd: () => `? check ${r.pick(['stealth', 'STR', 'luk', '__proto__', 'constructor', nm()])} — ${nm()} | dc: ${r.pick([...['easy', 'hard'], nu()])} | roll: ${nu()} | result: ${r.pick(['success', 'critical', 'fail', ''])}${r.chance(0.3) ? ` | who: ${nm()}` : ''}`,
        joinOdd: () => `+ join ${nm()} — a stranger | level: ${nu()} | role: ${nm()}`,
        skillOdd: () => `+ skill ${nm()} — ${nm()}: does ${nu()} damage | taught by: ${nm()}`,
        encounterOdd: () => `! encounter ${nu()} ${nm()} — attack | tier: ${r.pick(['deadly', 'even', 'trivial', 'god', ''])} | stakes: ${r.pick(['death', 'normal', ''])}`,
        npcOdd: () => `~ npc ${nm()} | ${r.pick(['trust', 'affection', 'desire', 'tension', '__proto__', 'constructor', 'stage', 'Trust', 'trüst'])}: ${r.pick(['+15', '+16', '=100', '=-100', '=1e309', '+٣', '+３', `+${nu()}`, `-${nu()}`, `=${nu()}`])}`,
        questOdd: () => {
            const k = r.pick(['Rats', 'Fetch', 'Errand', nm()]);
            return r.pick([
                `+ quest ${k} — a job I accepted | giver: ${nm()} | goal: ${r.pick([`Bring ${nu()} Rope`, `Kill ${nu()} Wolf`, 'Find the ring'])} | reward: ${nu()} gold | ${r.pick(['rank', 'difficulty'])}: ${r.pick(['S', 'A', 'nightmare', 'easy', 'Z', '__proto__', nu()])}`,
                `- quest ${k} — turned in`,
                `- quest ${k} — turned in | reward: ${nu()} gold`,
                `~ quest ${k} | met: yes`,
                `~ quest ${k} | progress: ${nu()}/${nu()}`,
                `- quest ${k} — failed`,
            ]);
        },
        timeOdd: () => r.pick([`! time +${nu()}h`, `! time +${nu()}d`, `~ time ${r.pick(['March', 'Goldwane', 'Smarch', '__proto__'])} ${nu()}, ${r.pick(['8:00 am', '11:59 pm', '24:00', '9:60 am', '٠٩:٠٠', '12:00 pm'])}`, `! time -${nu()}h`]),
        placeOdd: () => `~ place ${nm()} | kind: ${r.pick(['settlement', 'wild', 'dungeon', nm()])} | region: ${nm()}${r.chance(0.3) ? ` | with: ${nm()}` : ''}`,
        presentOdd: () => `${r.pick(['+', '-'])} present ${Array.from({ length: r.int(1, 6) }, nm).join(', ')}`,
        routeOdd: () => `+ route ${nm()} — ${nm()} | ${r.pick(['hours', 'days'])}: ${nu()} | kind: road`,
        marketOdd: () => `! market ${nm()} — ${nm()} | until: ${r.pick(['+2d', '+1e309d', nu()])}`,
        directorOdd: () => `+ ${r.pick(['agenda', 'beat', 'clock', 'event', 'faction', 'hook', 'landmark', 'secret', 'world'])} ${nm()} — ${nm()} | ${r.pick(['on', 'due', 'area', 'state', 'region'])}: ${r.pick([nu(), nm(), '+1e309h'])}`,
        protoLabels: () => `+ item ${nm()} | __proto__: ${nu()} | constructor: x | prototype: y | toString: z | then: w | qty: ${nu()}`,
    };
    const EXTRA = Object.keys(extra);

    // Groups of lines that duplicate or contradict each other in one reply.
    const conflict = () => r.pick([
        () => ['+ coin 30', '- coin 30'],
        () => ['+ coin 30', '+ coin 30', '+ coin 30', '+ coin 30'],
        () => ['- coin 30 | to: Fenna', '- coin 30 | to: Fenna'],
        () => ['+ item Rope | qty: 20', '+ item Rope | qty: 20', '+ item rope | qty: 20', '+ item ROPE | qty: 20', '+ item Rоpe | qty: 20', '+ item Ｒｏｐｅ | qty: 20'],
        () => ['+ item Rope | qty: 5', '- item Rope | qty: 5', '+ item Rope | qty: 5'],
        () => ['~ item Rope | qty: 20', '~ item Rope | qty: 40', '~ item Rope | qty: 60'],
        () => ['- item Rope | qty: -20', '- coin -50', '+ coin -50', '- item Healing Draught | qty: -5'],
        () => ['- quest Fetch — turned in', '- quest Fetch — turned in', '- quest fetch — turned in', '- quest Rats — turned in', '- quest Errand — turned in'],
        () => ['~ npc Fenna | trust: +15', '~ npc Fenna | trust: +15', '~ npc fenna | trust: +15', '~ npc Ｆｅｎｎａ | trust: +15', '~ npc Fen​na | trust: +15'],
        () => ['~ npc Fenna | trust: =100', '~ npc Fenna | trust: =-100'],
        () => ['~ wound Ren — healed | heal: grievous', '~ wound Ren — healed | heal: grievous', '~ wound ren — healed | heal: grievous'],
        () => ['! use Healing Draught | on: Ren', '! use Healing Draught | on: Ren', '! use Healing Draught | on: Ren | qty: 3'],
        () => ['! rest long — inn', '! rest long — inn', '! rest short — camp'],
        () => ['? check stealth — sneak | dc: hard | roll: 1', '? check stealth — sneak | dc: hard | roll: 2', '? check stealth — sneak | dc: hard | roll: 1'],
        () => ['! time +30d', '! time +30d', '! time +30d', '! time +30d'],
        () => ['+ join Lyra — again | level: 99', '+ join Lyra — again | level: 1e309', '- leave Lyra — bye'],
        () => ['+ item Superior Healing Potion | qty: 1', '+ item Mithril Dagger | qty: 1', '+ item Dragon Crown | qty: 1'],
        () => ['~ place Bluewatch | kind: settlement', '~ place Bluewatch | kind: dungeon', '~ place Bluewatch'],
    ])();

    function line() {
        const roll = r();
        if (roll < 0.45) return extra[r.pick(EXTRA)]();
        return g.line();
    }

    // A reasoning block holding a draft (with a sentinel that must never be read).
    function reasoning(lines) {
        const tag = r.pick(['think', 'thinking', 'reasoning', 'THINK', 'Think']);
        const close = r.chance(0.2) ? r.pick(['think', 'thinking', 'reasoning']) : tag;
        const attr = r.chance(0.1) ? ' type="x"' : '';
        const body = `<Changes>\n${[...lines, `+ item ${SENTINEL} | qty: 1`, `~ npc ${SENTINEL} | trust: +5`].join('\n')}\n</Changes>`;
        return { text: `<${tag}${attr}>\nLet me plan.\n${body}\n</${close}>`, closed: true };
    }

    function reply() {
        const base = g.reply();
        let { text } = base;
        const lines = [...base.lines];
        const shape = r.pick(['base', 'base', 'mixed', 'mixed', 'conflict', 'reason', 'reasonAfter', 'many', 'nested', 'markup', 'cut', 'cont', 'cont']);
        let think = false;
        let cut = null;
        let cont = null;
        if (shape === 'mixed' || shape === 'cut' || shape === 'cont') {
            const n = r.int(1, 14);
            const own = Array.from({ length: n }, line);
            lines.push(...own);
            text = `${r.pick(['The road bends.', 'Ren drinks.', ''])}\n\n<Changes>\n${own.join('\n')}\n</Changes>`;
        }
        if (shape === 'conflict') {
            const own = [...conflict(), ...(r.chance(0.5) ? conflict() : []), ...Array.from({ length: r.int(0, 4) }, line)];
            lines.push(...own);
            text = `Story.\n\n<Changes>\n${own.join('\n')}\n</Changes>`;
        }
        if (shape === 'reason' || shape === 'reasonAfter') {
            const draft = Array.from({ length: r.int(1, 6) }, line);
            const rs = reasoning(draft);
            think = true;
            text = shape === 'reason' ? `${rs.text}\n\n${text}` : `${text}\n\n${rs.text}`;
        }
        if (shape === 'many') {
            const own = Array.from({ length: r.pick([151, 400, 3000]) }, line);
            text = `Story.\n<Changes>\n${own.join('\n')}\n</Changes>`;
        }
        if (shape === 'nested') {
            const own = Array.from({ length: r.int(1, 6) }, line);
            text = `Story.\n${r.pick([
                `<Changes>\n<details><summary>x</summary>\n${own.join('\n')}\n</details>\n</Changes>`,
                `<div><Changes>\n${own.join('\n')}\n</Changes></div>`,
                `<Changes>\n<Changes>\n<Changes>\n${own.join('\n')}\n</Changes>\n</Changes>`,
                `<Changes>\n${own.join('\n')}\n<Changes>\n${own.join('\n')}\n</Changes>\n</Changes>`,
                `<Changes>\n${own.map(l => `<p>${l}</p>`).join('\n')}\n</Changes>`,
                `<Changes>\n<![CDATA[\n${own.join('\n')}\n]]>\n</Changes>`,
                `<pre><code><Changes>\n${own.join('\n')}\n</Changes></code></pre>`,
            ])}`;
        }
        if (shape === 'markup') {
            const own = Array.from({ length: r.int(1, 6) }, line);
            text = `<style>*{display:none}</style><script>throw 1</script>Story <img src=x onerror=alert(1)>\n<Changes>\n${own.map(l => `${l} <b onclick=x>bold</b>`).join('\n')}\n</Changes>`;
        }
        if (shape === 'cut') {
            const at = r.int(1, Math.max(1, text.length - 1));
            text = text.slice(0, at);
            cut = { stopped: r.chance(0.5) };
        }
        if (shape === 'cont') {
            const at = r.int(1, Math.max(1, text.length - 1));
            cont = { first: text.slice(0, at), rest: text.slice(at), stopped: r.chance(0.5) };
        }
        return { text, lines, style: base.style, shape, think, cut, cont };
    }
    return { ...g, reply, line, extra, conflict, SENTINEL };
}
