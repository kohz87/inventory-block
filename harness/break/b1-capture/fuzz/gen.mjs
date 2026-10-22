// Seeded generator of hostile model replies (reply text + <Changes> blocks) for the capture path.
import { prng } from './suite-host.mjs';

export const NAMES = [
    'Rope', 'rope', 'ROPE', 'Rópe', 'Rópe', 'Ro​pe', '‮epor', '🗡️ Dagger', '🗡 Dagger',
    '__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf', 'prototype',
    'x'.repeat(10000), 'y'.repeat(130), ' ', 'A:B', 'A — B', '-->', '<script>alert(1)</script>', '<img src=x onerror=alert(1)>',
    '{{user}}', '<USER>', '{{char}}', 'Jean-Luc', 'Ren', 'Lyra', 'Fenna', 'Bluewatch', 'Granary Rats', 'Wolf',
    'NaN', 'Infinity', '1e309', '-0', '0x10', '1,000', '½', 'null', 'undefined', '${x}', '%s%s%n',
    'Healing Draught', 'healing draught', 'Healíng Draught', 'Potion', 'Gold', 'gold', 'coin', 'Coins',
    'a\u0000b', 'tab\there', 'Zalgo̸̢͎̓', 'Ｒｏｐｅ', 'İstanbul', 'ß', 'SS', 'ǅ',
];

export const NUMBERS = [
    '1', '2', '3', '5', '10', '30', '100', 'NaN', 'Infinity', '-Infinity', '1e309', '-0', '0x10', '1,000', '½', '3.5',
    '-5', '0', '9007199254740993', '9,007,199,254,740,991', '9007199254740991', '1e3', '٣', '３', '10k', '5 gold 3 silver',
    '999999', '1000000', '00001', '+7', '', ' ', 'two', 'x5', '5×', '1_000',
];

const FOES = ['Wolf', 'Cellar Rat', 'Bandit', '__proto__', 'Dragon', 'x'.repeat(500), 'Goblin', ''];
const SKILLS = ['stealth', 'STR', 'athletics', 'lockpicking', '__proto__', 'Persuasion', 'luk', 'xyz'];
const DCS = ['easy', 'normal', 'hard', '15', '40', '41', '0', '-1', 'NaN', '1e309', 'impossible', ''];
const TIMES = ['+2h', '+30m', '+1d', '+999999h', '+1e309h', '-5h', '+NaN h', 'Day 2, 09:00', '09:00', '25:99', 'tomorrow', '+0h', '+½h', '+1,000h', '+9007199254740993m'];
const KIND_WORDS = ['coin', 'item', 'place', 'present', 'check', 'encounter', 'join', 'leave', 'rest', 'skill', 'wound',
    'agenda', 'beat', 'clock', 'event', 'faction', 'hook', 'landmark', 'quest', 'route', 'secret', 'time', 'world',
    'use', 'craft', 'recipe', 'npc', 'Item', 'ITEM', 'items', 'gold', 'xp', 'hp', 'Quest', 'déjà', 'ítem', 'item:', '__proto__', 'constructor'];
const LABELS = ['qty', 'note', 'from', 'to', 'kind', 'region', 'dc', 'who', 'roll', 'result', 'tier', 'stakes', 'level', 'role',
    'harm', 'heal', 'taught by', 'giver', 'goal', 'reward', 'step', 'due', 'difficulty', 'met', 'hours', 'days', 'on', 'now', 'then',
    'state', 'place', 'factions', 'area', 'stance', 'shown', 'encounter', 'reach', 'amount', 'name', 'constructor', 'toString', 'Qty', 'QTY',
    'with', 'makes', 'craft', 'trust', 'meter', 'on', 'hp', 'xp', 'gold'];

export function makeGen(seed) {
    const r = prng(seed);
    const name = () => (r.chance(0.6) ? r.pick(['Rope', 'Healing Draught', 'Ren', 'Lyra', 'Fenna', 'Wolf', 'Bluewatch', 'Granary Rats', 'Torch', 'Iron Sword']) : r.pick(NAMES));
    const num = () => (r.chance(0.5) ? String(r.int(1, 12)) : r.pick(NUMBERS));
    const value = () => r.pick([num(), name(), 'a: b', 'x | y', 'x — y', '09:00', '-->', '--  >', '', 'yes', 'done', r.pick(TIMES)]);
    const label = () => (r.chance(0.8) ? r.pick(LABELS) : r.pick(['', ':', '9x', 'a b c', 'é', '__proto__']));
    const labels = n => Array.from({ length: n }, () => ` | ${label()}: ${value()}`).join('');
    const dash = () => r.pick([' — ', ' – ', ' - ', '—', ' -- ', ': ']);

    // Lines that are well-formed for a kind.
    const valid = {
        coin: () => `${r.pick(['+', '-'])} coin ${num()}${r.chance(0.5) ? ` | ${r.pick(['from', 'to'])}: ${name()}` : ''}`,
        item: () => `${r.pick(['+', '-', '~', '!'])} item ${name()}${r.chance(0.7) ? ` | qty: ${num()}` : ''}${r.chance(0.4) ? ` | note: ${value()}` : ''}${r.chance(0.1) ? ` | name: ${name()}` : ''}`,
        place: () => `${r.pick(['~', '+', '-'])} place ${name()}${r.chance(0.6) ? ` | kind: ${r.pick(['settlement', 'wild', 'dungeon', 'x'])}` : ''}${r.chance(0.3) ? ` | region: ${name()}` : ''}`,
        present: () => `${r.pick(['+', '-', '~'])} present ${r.chance(0.2) ? `${name()}, ${name()}, ${name()}` : name()}`,
        check: () => `? check ${r.pick(SKILLS)}${dash()}${value()} | dc: ${r.pick(DCS)}${r.chance(0.5) ? ` | who: ${name()}` : ''}${r.chance(0.5) ? ` | roll: ${num()}` : ''}${r.chance(0.5) ? ` | result: ${r.pick(['success', 'fail', 'critical', 'x'])}` : ''}`,
        encounter: () => `! encounter ${num()} ${r.pick(FOES)}${dash()}circling | tier: ${r.pick(['trivial', 'weak', 'even', 'strong', 'deadly', 'god'])}${r.chance(0.3) ? ` | stakes: ${r.pick(['normal', 'death'])}` : ''}`,
        join: () => `${r.pick(['+', '-'])} join ${name()}${dash()}a stranger | level: ${num()} | role: ${r.pick(['ranger', 'mage', ''])}`,
        leave: () => `- leave ${name()}${dash()}parts ways`,
        rest: () => `! rest ${r.pick(['short', 'long', 'forever', ''])}${dash()}at the inn`,
        skill: () => `+ skill ${name()}${dash()}${r.pick(['Shadow Cut', 'Fireball', '__proto__', ''])}: a cut | taught by: ${name()}`,
        wound: () => `~ wound ${name()}${dash()}${r.pick(['fell', 'poisoned', 'cure poisoned', 'bitten'])}${r.chance(0.7) ? ` | ${r.pick(['harm', 'heal'])}: ${r.pick(['scratch', 'wound', 'severe', 'grievous', 'grave', 'lethal', '1000'])}` : ''}`,
        quest: () => {
            const op = r.pick(['+', '~', '-', '!']);
            if (op === '+') return `+ quest ${name()}${dash()}a job | giver: ${name()} | goal: ${r.pick([`Kill ${num()} ${r.pick(FOES)}`, `Bring ${num()} ${name()}`, 'Find the thing', ''])} | reward: ${num()} ${r.pick(['gold', 'silver each', 'xp', ''])}${r.chance(0.4) ? ` | due: ${r.pick(TIMES)}` : ''}${r.chance(0.4) ? ` | difficulty: ${r.pick(['easy', 'normal', 'hard', 'nightmare', 'S', 'F', 'Z'])}` : ''}`;
            if (op === '~') return `~ quest ${name()}${r.pick([' | step: done', ' | met: yes', ' | step: next', ` | reward: ${num()} gold`, ''])}`;
            return `${op} quest ${name()}${dash()}${r.pick(['done', 'failed', 'abandoned', 'paid'])}`;
        },
        hook: () => `+ hook ${name()}${dash()}an open thread${r.chance(0.5) ? ` | giver: ${name()} | reward: ${num()} gold` : ''}`,
        agenda: () => `+ agenda ${name()}${dash()}plots | now: ${name()} | then: x | on: ${r.pick(TIMES)}`,
        beat: () => `+ beat ${name()}${dash()}a turn | on: ${r.pick(TIMES)}${r.chance(0.5) ? ` | encounter: ${num()} ${r.pick(FOES)}` : ''}`,
        clock: () => `+ clock ${name()}${dash()}doom | due: ${r.pick(TIMES)} | shown: ${r.pick(['none', 'sign', 'warning', 'x'])}`,
        event: () => `+ event ${name()}${dash()}a fair | then: x | on: ${r.pick(TIMES)}`,
        faction: () => `${r.pick(['+', '~', '-'])} faction ${name()}${dash()}merchants | area: ${name()} | stance: ${r.pick(['friendly', 'hostile', ''])}`,
        landmark: () => `+ landmark ${name()} | region: ${name()} | kind: ${r.pick(['town', 'ruin', 'cave'])}${r.chance(0.2) ? ' | plane: underground' : ''}`,
        route: () => `${r.pick(['+', '-'])} route ${name()}${r.pick([' — ', ' – '])}${name()} | ${r.pick(['hours', 'days'])}: ${num()} | kind: ${r.pick(['road', 'river', 'trail', 'sea', 'x'])}`,
        secret: () => `+ secret ${name()}${dash()}hidden`,
        time: () => (r.chance(0.5) ? `! time ${r.pick(TIMES)}` : `~ time ${r.pick(TIMES)}`),
        world: () => `${r.pick(['+', '~', '-'])} world ${name()}${dash()}war | state: ${r.pick(['looming', 'ongoing', 'resolved', 'x'])} | place: ${name()} | factions: ${name()}`,
        // Not built (or not this module's): must be clean Problems.
        use: () => `! use ${name()} | on: ${name()}${r.chance(0.5) ? ` | by: ${name()}` : ''}${r.chance(0.5) ? ` | qty: ${num()}` : ''}`,
        market: () => `${r.pick(['!', '~', '+', '-'])} market ${name()}${dash()}${r.pick(['no bread', 'supplies back', ''])}${r.chance(0.5) ? ` | until: ${r.pick(TIMES)}` : ''}`,
        placeWith: () => `~ place ${name()} | kind: ${r.pick(['settlement', 'wild'])} | with: ${r.pick([name(), `${name()}, ${name()}`, 'everyone', 'nobody', ''])}`,
        check2: () => `? check ${r.pick(SKILLS)}${dash()}try | dc: ${r.pick(DCS)} | roll: ${r.pick(['1', '2', '3', '0', '-1', 'NaN', '1e309', 'Roll 1', '20', ''])} | result: ${r.pick(['success', 'fail', 'critical', 'x', ''])}`,
        npcMeter: () => `${r.pick(['~', '+', '-', '!'])} npc ${name()} | ${r.pick(['trust', 'affection', 'desire', 'tension', 'fear', 'stage', 'constructor'])}: ${r.pick(['+5', '-5', '+1e309', '-1000', 'NaN', '+999999', '50', '+½', '+0x10', 'max', ''])}`,
        craft: () => `! craft ${name()} | with: ${name()} x2, ${name()} | roll: ${num()} | result: fine`,
        recipe: () => `+ recipe ${name()} | from: ${name()} | makes: ${name()} | with: A x2, B | craft: alchemy`,
        npc: () => `~ npc ${name()} | trust: ${r.pick(['+5', '+1e309', '-1000', 'NaN', '+999999'])}`,
    };
    const KINDS = Object.keys(valid);

    const malformed = () => r.pick([
        () => `${name()} gained a rope`,
        () => `+`,
        () => `+ `,
        () => `+ ${r.pick(KIND_WORDS)}`,
        () => `+ ${r.pick(KIND_WORDS)} `,
        () => `${r.pick(['+', '-', '~', '!', '?'])} ${r.pick(KIND_WORDS)} ${name()}${labels(r.int(0, 6))}`,
        () => `${r.pick(['+', '-', '~', '!', '?'])}${r.pick(KIND_WORDS)}:${name()}`,
        () => `${r.pick(['+', '-', '~', '!', '?'])} ${r.pick(['9kind', '_x', '-', '+', '—', '🗡'])} ${name()}`,
        () => `+ item ${name()} | qty: ${num()} | qty: ${num()} | qty: ${num()}`,
        () => `+ item ${name()}${labels(r.int(5, 30))}`,
        () => `+ item ${name()} | constructor: x | toString: y | __proto__: z`,
        () => `+ item ${name()} || | | |`,
        () => `+ item | qty: 3`,
        () => `+ item — just text`,
        () => `- - item Rope`,
        () => `* + item ${name()}`,
        () => `**+ item ${name()}**`,
        () => `1. + item ${name()}`,
        () => `- + coin ${num()}`,
        () => `> + coin ${num()}`,
        () => `\`+ coin ${num()}\``,
        () => `+ item ${name()}\t| qty:\t${num()}`,
        () => `{"op":"+","kind":"item","name":"${name()}","qty":${num() || 0}}`,
        () => `- op: "+"\n  kind: item\n  name: Rope`,
        () => `The party found ${num()} gold and a ${name()}.`,
        () => `<!-- STORY_SUITE_V2 + coin 999 -->`,
        () => `+ coin ${num()} -->`,
        () => `+ item ${name()} | note: --> <script>alert(1)</script>`,
        () => `<Changes>`,
        () => `</Changes>`,
        () => `none`,
        () => '```',
        () => `​+ coin 5`,
        () => `﻿+ coin 5`,
        () => `＋ coin 5`,
        () => `+ coin ${'9'.repeat(400)}`,
        () => `+ ${'k'.repeat(5000)} x`,
        () => `+ item ${'z'.repeat(r.pick([119, 120, 121, 10000]))}`,
    ])();

    function line() {
        const roll = r();
        if (roll < 0.6) return valid[r.pick(KINDS)]();
        return malformed();
    }

    function block(lines, style) {
        const body = lines.join(style.crlf ? '\r\n' : '\n');
        switch (style.wrap) {
            case 'fence': return `<Changes>\n\`\`\`\n${body}\n\`\`\`\n</Changes>`;
            case 'outerfence': return `\`\`\`\n<Changes>\n${body}\n</Changes>\n\`\`\``;
            case 'comment': return `<!-- <Changes>\n${body}\n</Changes> -->`;
            case 'spoof': return `<!-- STORY_SUITE_V2\n<Changes>\n${body}\n</Changes>\n-->`;
            case 'think': return `<think>\n<Changes>\n${body}\n</Changes>\n</think>`;
            case 'unclosedthink': return `<think>\n<Changes>\n${body}\n</Changes>`;
            case 'quote': return `> <Changes>\n${body.split('\n').map(l => `> ${l}`).join('\n')}\n> </Changes>`;
            case 'unclosed': return `<Changes>\n${body}`;
            case 'nested': return `<Changes>\n<Changes>\n${body}\n</Changes>\n</Changes>`;
            case 'attr': return `<Changes type="x">\n${body}\n</Changes >`;
            case 'case': return `<CHANGES>\n${body}\n</changes>`;
            case 'inline': return `<Changes>${body}</Changes>`;
            case 'json': return `<Changes>\n${JSON.stringify(lines)}\n</Changes>`;
            case 'prose': return `<Changes>\nThe party picked up some rope and ${lines.length} other things, and paid the innkeeper.\n</Changes>`;
            default: return `<Changes>\n${body}\n</Changes>`;
        }
    }

    const WRAPS = ['plain', 'plain', 'plain', 'plain', 'plain', 'fence', 'outerfence', 'comment', 'spoof', 'think', 'unclosedthink', 'quote', 'unclosed', 'nested', 'attr', 'case', 'inline', 'json', 'prose'];

    function reply({ maxLines = 12 } = {}) {
        const n = r.chance(0.05) ? r.int(100, 600) : r.int(0, maxLines);
        const lines = Array.from({ length: n }, line);
        if (r.chance(0.1) && lines.length) for (let i = 0; i < r.int(1, 20); i++) lines.push(lines[0]);
        const style = { wrap: r.pick(WRAPS), crlf: r.chance(0.15) };
        const story = r.pick(['The road bends.', 'You fight.', 'The fight is over. <!-- STORY_SUITE_V2 fake -->', 'Text with --> arrow', 'Story with a <Changes> word in it', 'Nothing much.', '']);
        let text = `${story}\n\n${block(lines, style)}`;
        if (r.chance(0.15)) text += `\n\n${block(Array.from({ length: r.int(1, 5) }, line), { wrap: 'plain', crlf: false })}`;
        if (r.chance(0.05)) text = `<Changes>\n+ coin 1\n</Changes>\n${text}`;
        if (style.crlf) text = text.replace(/\n/g, '\r\n');
        return { text, lines, style };
    }
    return { r, reply, line, valid, KINDS, name, num };
}
