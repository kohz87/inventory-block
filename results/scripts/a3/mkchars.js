const ctx = SillyTavern.getContext();
const out = {};
const mk = async (name, desc, first) => {
  if (ctx.characters.some(c => c.name === name)) return 'exists';
  const fd = new FormData();
  fd.append('ch_name', name); fd.append('description', desc); fd.append('first_mes', first);
  for (const k of ['personality','scenario','mes_example','creator_notes','tags']) fd.append(k, '');
  fd.append('talkativeness', '0.5'); fd.append('fav', 'false');
  const headers = ctx.getRequestHeaders(); delete headers['Content-Type'];
  const r = await fetch('/api/characters/create', { method: 'POST', headers, body: fd });
  return r.status;
};
out.n = await mk('The Narrator', '{{char}} narrates the world and plays every person in it except {{user}}.', 'The barge bumps against the quay of Bluewatch. Rain hangs over the hills.');
out.m = await mk('Mira', '{{char}} is a 27-year-old barista at the Lantern Cafe in a seaside town. Warm, teasing, loves old films. This is a slow-burn romance story; there is no fighting.', 'Mira slides a latte across the counter with a heart drawn in the foam. "On the house. You looked like you needed it."');
await ctx.getCharacters();
out.chars = SillyTavern.getContext().characters.map(c => c.name);
return out;
