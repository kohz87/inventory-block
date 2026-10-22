// Points a SillyTavern settings.json at the mock model (OpenAI-compatible custom endpoint, no streaming).
import { readFileSync, writeFileSync } from 'node:fs';
const [file, url] = process.argv.slice(2);
const s = JSON.parse(readFileSync(file, 'utf8'));
// firstRun leaves SillyTavern on its onboarding popup: characters and settings never finish loading.
s.firstRun = false;
s.main_api = 'openai';
s.oai_settings = { ...(s.oai_settings ?? {}), chat_completion_source: 'custom', custom_url: url, custom_model: 'mock-model', stream_openai: false };
writeFileSync(file, JSON.stringify(s, null, 4));
