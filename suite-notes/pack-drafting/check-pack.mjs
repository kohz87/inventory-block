// Checks a pack file with Story Block's own validator (the same one the extension and Studio use).
// Usage, from a Story_block clone:  node /path/to/check-pack.mjs /path/to/pack.json
// Prints "OK" with the rules and pack hashes, or every error with its code and path.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const file = process.argv[2];
if (!file) { console.error('usage: node check-pack.mjs <pack.json>   (run from a Story_block clone)'); process.exit(2); }
const { validatePack } = await import(pathToFileURL(resolve('src/v2/packs/validate.js')).href);
const pack = JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
const result = validatePack(pack, { capabilities: ['story-director', 'rpg-battle', 'rb-rules-v2'] });
if (result.ok) {
    console.log('OK', JSON.stringify({ rulesHash: result.rulesHash ?? null, packHash: result.packHash ?? null }));
} else {
    for (const e of result.errors ?? []) console.log(`${e.code}\t${e.path ?? ''}\t${e.message ?? ''}`);
    console.log(`${(result.errors ?? []).length} error(s)`);
    process.exit(1);
}
