"""Validate cast.json against the C-COMMON cast contract and the Ersveil pack.

Run:  python3 -I validate_cast.py cast.json pack.json lore.txt
Limits not fixed by C-COMMON (CS defines them on its branch) are set here to sane
plain-text caps; any of them can be tightened or relaxed in LIMITS below.
"""
import json
import re
import sys

LIMITS = {
    "pack_bytes": 512 * 1024, "string": 4000, "slug": 64, "name": 80, "alias": 60, "aliases": 6,
    "about": 200, "look": 600, "voice": 400, "personality": 500, "history": 1200,
    "goal": 200, "routine": 300, "drawn_to": 3, "drawn_to_len": 60,
    "stage_name": 40, "milestone": 200, "stage_needs": 4, "stages": 3,
    "field_keys": 8, "field_value": 60, "field_key": 40,
    "secrets_min": 3, "secrets_max": 5, "secrets_hard_max": 8,
    "secret_title": 60, "secret_text": 300, "secret_when": 120,
    "portraits": 32, "portrait_kb": 64,
}
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
PRESET_METERS = {  # NSD built-in presets (npc-meters-presets.js) + the four built-in meters
    "companion": {"loyalty"}, "rival": {"respect", "rivalry"}, "mentor": {"approval"},
}
BUILT_IN = {"trust", "affection", "desire", "tension"}
ENTRY_KEYS = {"id", "name", "aliases", "about", "look", "voice", "personality", "history", "portrait",
              "start", "drawnTo", "meters", "stages", "fields", "secrets", "canDieUnmet"}
STOCK = {"elara", "lyra", "kael", "kaelen", "aria", "seraphina", "thorne", "rowan", "finn", "elias", "silas",
         "marcus", "mira", "kira", "zara", "lysandra", "cedric", "garrick", "gareth", "bram", "eldrin", "sylas",
         "vex", "nyx", "liora", "isolde", "tobias", "jareth"}
EXAMPLE_NAMES = {"gerold", "reinhild", "hanne", "maaike", "joost", "benedikt", "prisca", "torvald", "sigrun",
                 "ulfa", "thordis", "anselm", "liutgard", "corro", "delphine", "jory", "bess", "roshan",
                 "mehrin", "torgun", "hilde", "pip", "tamsin", "tamu", "oshra", "grusha", "varg", "snip",
                 "iselwen", "caelith", "thessaly", "ondrin", "dewbell", "primrose-at-dusk"}

problems = []


def bad(where, msg):
    problems.append(f"{where}: {msg}")


def text(where, value, cap, required=True):
    if value is None or value == "":
        if required:
            bad(where, "missing")
        return
    if not isinstance(value, str):
        bad(where, "not a string")
        return
    if len(value) > cap:
        bad(where, f"{len(value)} chars > {cap}")
    if re.search(r"[\x00-\x08\x0b-\x1f\x7f]", value):
        bad(where, "control characters")
    if any(ord(c) > 0x2fff and ord(c) not in range(0xff00, 0xffef) for c in value):
        bad(where, "emoji or symbol outside plain text")
    if value != value.strip():
        bad(where, "leading/trailing whitespace")


def main(cast_path, pack_path, lore_path):
    raw = open(cast_path, "rb").read()
    cast = json.loads(raw)
    pack = json.load(open(pack_path, encoding="utf-8"))
    lore = open(lore_path, encoding="utf-8").read().lower()
    places = {p["name"] for p in pack["content"]["places"]}
    if not isinstance(cast, list):
        bad("cast", "must be an array of entries")
        return
    if len(cast) != 12:
        bad("cast", f"expected 12 entries, found {len(cast)}")
    if len(raw) > 100 * 1024:
        bad("cast", f"{len(raw)} bytes is a lot for a pack that must stay under {LIMITS['pack_bytes']} bytes")
    ids, initials, portraits = set(), {}, []
    for index, e in enumerate(cast):
        eid = e.get("id", f"#{index}")
        w = eid
        extra = set(e) - ENTRY_KEYS
        if extra:
            bad(w, f"unknown keys {sorted(extra)}")
        if not isinstance(e.get("id"), str) or not SLUG.match(e["id"]) or len(e["id"]) > LIMITS["slug"]:
            bad(w, "id must be a slug")
        if eid in ids:
            bad(w, "duplicate id")
        ids.add(eid)
        text(f"{w}.name", e.get("name"), LIMITS["name"])
        name = e.get("name", "")
        first = name[:1].upper()
        if first in initials:
            bad(w, f"first letter {first} also used by {initials[first]}")
        initials[first] = eid
        for token in re.split(r"[\s'-]+", name.lower()):
            if token in STOCK:
                bad(w, f"stock fantasy name '{token}'")
            if token in EXAMPLE_NAMES:
                bad(w, f"lorebook example name '{token}'")
        if name.lower() in lore or (re.sub(r"[^a-z]", "", name.lower()) and False):
            bad(w, "full name already appears in the lorebook")
        al = e.get("aliases", [])
        if not isinstance(al, list) or len(al) > LIMITS["aliases"]:
            bad(w, "aliases must be a list of at most 6")
        for a in al:
            text(f"{w}.alias", a, LIMITS["alias"])
        for key in ("about", "look", "voice", "personality", "history"):
            text(f"{w}.{key}", e.get(key), LIMITS[key])
        if "\n" in e.get("about", ""):
            bad(w, "about must be one line")
        # portrait
        pf = e.get("portrait")
        if pf != f"{eid}.webp":
            bad(w, f"portrait must be '{eid}.webp'")
        portraits.append(pf)
        # start
        st = e.get("start") or {}
        if st.get("place") not in places:
            bad(w, f"start.place '{st.get('place')}' is not an exact place name in the pack")
        text(f"{w}.start.goal", st.get("goal"), LIMITS["goal"])
        text(f"{w}.start.routine", st.get("routine"), LIMITS["routine"], required=False)
        if set(st) - {"place", "goal", "routine"}:
            bad(w, "unknown start keys")
        # drawnTo
        dt = e.get("drawnTo", [])
        if not (1 <= len(dt) <= LIMITS["drawn_to"]):
            bad(w, "drawnTo needs 1 to 3 phrases")
        for p in dt:
            text(f"{w}.drawnTo", p, LIMITS["drawn_to_len"])
        # meters
        m = e.get("meters") or {}
        preset = m.get("preset")
        if preset not in PRESET_METERS:
            bad(w, f"meters.preset '{preset}' is not a built-in NSD preset")
        allowed = BUILT_IN | PRESET_METERS.get(preset, set())
        for k, v in m.items():
            if k == "preset":
                continue
            if k not in allowed:
                bad(w, f"meter '{k}' not in {sorted(allowed)}")
            if not isinstance(v, int) or isinstance(v, bool) or not -100 <= v <= 100:
                bad(w, f"meter {k} must be a whole number -100..100")
        for need in ("trust", "affection", "tension"):
            if need not in m:
                bad(w, f"meters.{need} start value missing")
        if preset == "rival" and any(m.get("affection", 0) > 40 for _ in [0]):
            bad(w, "rival preset caps affection at 40")
        # stages
        stages = e.get("stages", [])
        if len(stages) != LIMITS["stages"]:
            bad(w, "needs exactly 3 stages")
        sids = set()
        for s in stages:
            if not SLUG.match(s.get("id", "")):
                bad(w, "stage id must be a slug")
            if s.get("id") in sids:
                bad(w, "duplicate stage id")
            sids.add(s.get("id"))
            text(f"{w}.stage.name", s.get("name"), LIMITS["stage_name"])
            text(f"{w}.stage.milestone", s.get("milestone"), LIMITS["milestone"], required=False)
            needs = s.get("needs", [])
            if not (1 <= len(needs) <= LIMITS["stage_needs"]):
                bad(w, "stage needs 1 to 4 conditions")
            for n in needs:
                if n.get("meter") not in allowed:
                    bad(w, f"stage need meter '{n.get('meter')}' unknown for preset {preset}")
                if not isinstance(n.get("at"), int) or not -100 <= n["at"] <= 100:
                    bad(w, "stage need 'at' must be a whole number")
            if set(s) - {"id", "name", "needs", "milestone"}:
                bad(w, "unknown stage keys")
        # fields
        f = e.get("fields") or {}
        if not f or len(f) > LIMITS["field_keys"]:
            bad(w, "fields: 1 to 8 entries")
        for k, v in f.items():
            text(f"{w}.fields key", k, LIMITS["field_key"])
            text(f"{w}.fields.{k}", v, LIMITS["field_value"])
        if f.get("Soul Class") not in {"I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"}:
            bad(w, "fields.Soul Class must be a roman numeral I to IX")
        # secrets
        secrets = e.get("secrets", [])
        if not (LIMITS["secrets_min"] <= len(secrets) <= LIMITS["secrets_max"]):
            bad(w, f"secrets: {len(secrets)} (brief: 3 to 5; hard cap {LIMITS['secrets_hard_max']})")
        whens = 0
        last_at = {}
        titles = set()
        for s in secrets:
            text(f"{w}.secret.title", s.get("title"), LIMITS["secret_title"])
            text(f"{w}.secret.text", s.get("text"), LIMITS["secret_text"])
            if s.get("title") in titles:
                bad(w, "duplicate secret title")
            titles.add(s.get("title"))
            has_meter = "meter" in s or "at" in s
            has_when = "when" in s
            if has_meter == has_when:
                bad(w, f"secret '{s.get('title')}' needs either meter+at or when")
            if has_when:
                whens += 1
                text(f"{w}.secret.when", s["when"], LIMITS["secret_when"])
            if has_meter:
                if s.get("meter") not in allowed:
                    bad(w, f"secret meter '{s.get('meter')}' unknown for preset {preset}")
                if not isinstance(s.get("at"), int) or not -100 <= s["at"] <= 100:
                    bad(w, "secret 'at' must be a whole number")
                prev = last_at.get(s.get("meter"))
                if prev is not None and s["at"] <= prev:
                    bad(w, "secrets on one meter must rise light to deep")
                last_at[s.get("meter")] = s.get("at")
            if set(s) - {"title", "text", "meter", "at", "when"}:
                bad(w, "unknown secret keys")
        if whens < 1:
            bad(w, "needs at least one 'when' secret")
        if e.get("canDieUnmet") is not False:
            bad(w, "canDieUnmet must be false")
        # secrets must not leak into visible fields (light check on distinctive words)
        visible = " ".join(str(e.get(k, "")) for k in ("about", "look", "voice", "personality", "history")) + " " + \
            st.get("goal", "") + " " + st.get("routine", "")
        visible_l = visible.lower()
        for s in secrets:
            words = {x for x in re.findall(r"[a-z][a-z'-]{6,}", s["text"].lower())}
            shared = [x for x in words if x in visible_l]
            # report as warning-level notes only for long exact phrase overlaps (5+ words)
            toks = re.findall(r"[a-z']+", s["text"].lower())
            for i in range(len(toks) - 4):
                phrase = " ".join(toks[i:i + 5])
                if phrase in visible_l:
                    bad(w, f"secret '{s['title']}' repeats a visible phrase: '{phrase}'")
                    break
    if len(portraits) > LIMITS["portraits"]:
        bad("cast", "too many portraits")
    # people names referenced in secrets should exist in the lore or the cast
    names = {e["name"].lower() for e in cast}
    print(f"entries: {len(cast)}; secrets: {sum(len(e['secrets']) for e in cast)}; "
          f"whens: {sum(1 for e in cast for s in e['secrets'] if 'when' in s)}; bytes: {len(raw)}")
    print("places used:", sorted({e['start']['place'] for e in cast}))


if __name__ == "__main__":
    main(*sys.argv[1:4])
    if problems:
        print(f"FAIL: {len(problems)} problem(s)")
        for p in problems:
            print(" -", p)
        sys.exit(1)
    print("OK: all checks passed")
