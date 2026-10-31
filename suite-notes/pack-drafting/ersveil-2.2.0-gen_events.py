#!/usr/bin/env python3
"""Ersveil 2.2.0: the big-beat timeline events, the Court favour module and the Sealwarden recruit skill set.
Run: python3 -I gen_events.py <pack.json>  (rewrites the pack in place, keeping its own 7 events first)."""
import json, sys

MONTHS = ['Dawnwane', 'Rainmoot', 'Greengale', 'Highsun', 'Goldwane', 'Haywane', 'Emberwane', 'Nightfall', 'Frostfall',
          'Deepwinter', 'Icewane', 'Yearsend']
DAY = 1440


def T(year, month, day, hour=0):
    return year * 360 * DAY + (MONTHS.index(month) * 30 + day - 1) * DAY + hour * 60


# --- regions ------------------------------------------------------------------------------------------------------
FRONT = ['River Confederacy: Bluewatch', 'Shornmarch', 'Auvoth Compact', 'Border Kingdoms', 'Deep Northern Apex']
HIGHMARK = ['Highmark Empire']
BELT = ['Highmark Empire', 'Valegard', 'River Confederacy: core cities', 'River Confederacy: locks/connectors',
        'Wallwright League', 'Kingdom of Ashmere', 'Aurelion/Church Heartland', 'Silver Mark', 'Startrace Tower', 'Ironanvil']
SOUTH = ['Ardelian Empire and Southmarch', 'Verdantleaf', 'Fairy Court', 'United Chieftainates', 'Southern Wilds']
WEST = ['Western Barrens', 'Shackles', 'Glass Wastes and Ashkaran Dominion', 'Bloodbound League', 'Ashen Veil', 'Deepwalkers']
SEA = ['Tidebound/Stormmere', 'Atlantis', 'Emerald Coast', 'Special/Wildzone sites']
ALL = FRONT + BELT + SOUTH + WEST + SEA
assert len(set(ALL)) == len(ALL)


def at(regions):
    regions = list(dict.fromkeys(regions))
    assert all(r in ALL for r in regions), regions
    rest = [r for r in ALL if r not in regions]
    if not rest:
        return "query('scene.place') != null"
    if len(regions) <= len(rest):
        parts = ' || '.join(f"query('scene.place').region == '{r}'" for r in regions)
        return f"query('scene.place') != null && ({parts})"
    # the shorter way round: anywhere but the regions left out
    parts = ' || '.join(f"query('scene.place').region == '{r}'" for r in rest)
    return f"query('scene.place') != null && !({parts})"


def window(start, end):
    return f"time() != null && time() >= {start} && time() < {end}"


def since(name, minutes=0):
    assert '"' not in name
    return f"query('chronicle.passed', {{ name: \"{name}\", minutes: {minutes} }})"


FAV = "query('dataModules.view', { module: 'pack.ersveil/succession' })"
NOFAV = f"{FAV} == null"
def fav(who):
    return f"{FAV}.chat.{who}"


def lasting(name, state, summary, place=None, factions=None, keep=False):
    payload = {'name': name, 'state': state, 'summary': summary}
    if place: payload['place'] = place
    if factions: payload['factions'] = factions
    if keep: payload['keep'] = True
    assert len(name) <= 80 and len(summary) <= 240, (name, len(summary))
    assert not factions or (len(factions) <= 4 and all(len(f) <= 80 for f in factions))
    return {'command': 'chronicle.lasting', 'payload': payload}


EVENTS = []


def ev(id, when, cue, after=None, then=None):
    e = {'id': id}
    if after: e['after'] = after
    e['when'] = when
    e['cue'] = cue
    if then: e['then'] = then
    assert len(cue) <= 500, (id, len(cue))
    assert len(when) <= 500, (id, len(when))
    assert len(id) <= 120
    EVENTS.append(e)
    return id


def news(id, after, name, days, regions, cue):
    """One news event per group of regions small enough for a 500-character condition (ids id, id-2, id-3 …)."""
    head = f"time() != null && {since(name, days * DAY)} && "
    groups, group = [], []
    for region in dict.fromkeys(regions):
        if group and len(head + at(group + [region])) > 500:
            groups.append(group); group = []
        group.append(region)
    groups.append(group)
    for n, group in enumerate(groups):
        ev(id if n == 0 else f'{id}-{n + 1}', head + at(group), cue, after=after)


UNSEEN = 'Characters elsewhere do not know yet; word reaches them only when news arrives.'

# === CY 611: "The Turning came early" ===============================================================================
ev('flood-611-rumour', f"{window(T(611, 'Haywane', 7), T(611, 'Haywane', 12, 8))} && {at(FRONT)}",
   'Hunters come back early and uneasy: game is moving south a season before the Turning, frost wolves have been seen near the road in high summer, and the herds beyond the taiga are said to be restless. The signal keeper at Bluewatch has started sleeping in the tower.')
ev('flood-611', f"time() != null && time() >= {T(611, 'Haywane', 12, 8)}",
   f'Today the early flood begins: low-grade wildzone beasts (frost wolves, giant elk, tunnel scavengers, a few snow ogres) spill south out of the northern wildzone onto the Bluewatch road and the Border marches. Most people call it the Turning come early. {UNSEEN}',
   then=[lasting('The early flood', 'ongoing',
                 'Low-grade wildzone beasts spilled south onto the Bluewatch road and the Border marches a season early. The Guild posted flood contracts. Most call it an early Turning.',
                 'Bluewatch Village', ['Adventurer Guild', 'River Confederacy', 'Border Kingdoms'])])
ev('flood-611-scene', f"{window(T(611, 'Haywane', 12, 8), T(611, 'Haywane', 16))} && {at(['River Confederacy: Bluewatch', 'Shornmarch', 'Border Kingdoms', 'Auvoth Compact'])}",
   "The signal horn sounds from the north: beasts on the road, a season early. Watch-Captain Edda Rorke musters the Watch at the river-gate, the branch clerk pins flood contracts at F and E (pay doubled, the Guild's cut waived), and the Ninth Brazier ride out toward the wildzone edge. The flood is low-grade but wide: farms and convoys need guarding now.",
   after='flood-611')
news('flood-611-news', 'flood-611', 'The early flood', 6, BELT,
     'Travellers from the north bring word of an early stampede on the Bluewatch road and the Border marches. Merchants shrug: the Turning came early, that is all. Grain for the frontier costs a little more.')
ev('flood-611-ends', f"time() != null && {since('The early flood', 16 * DAY)}",
   'The early flood is over: the last beasts have been driven back or killed, the dead are buried, and the Guild has paid out its flood contracts. Frontier folk mutter that the true Turning is still to come.',
   after='flood-611',
   then=[lasting('The early flood', 'resolved',
                 'The early flood was cleared after about two weeks. The dead are buried and the flood contracts paid. Frontier folk say the true Turning is still to come.')])

ev('depths-611', f"time() != null && time() >= {T(611, 'Haywane', 13, 2)}",
   f'In the same week as the flood, a surge rises from the Auvoth Depths\' upper bands against the gates under the Seventh Seal Terrace. Seal-Captain Gurda Kelthul\'s Sealwardens and elite parties under Sunniva Halvard, the Lantern of Auvoth, hold it. The Guild calls it routine and keeps it quiet. {UNSEEN}',
   then=[lasting('Surge at the Depths gates', 'resolved',
                 'A surge from the upper bands struck the gates under the Seventh Seal Terrace. The Sealwardens and elite parties held it. The Guild calls it routine and keeps it quiet.',
                 'Auvoth', ['Adventurer Guild', 'Order of the Sealwardens'])])
ev('depths-611-scene', f"{window(T(611, 'Haywane', 13, 2), T(611, 'Haywane', 17))} && {at(['Auvoth Compact'])}",
   "Bells ring under the Seventh Seal Terrace and the descents are shut: a breach swarm is pressing the gates from the upper bands. Sealwardens run with lamps, and Sunniva Halvard's party goes down behind them. By dusk Guild wardens are telling everyone it is routine. Salvage from the gates will hit the Pale Market within days.",
   after='depths-611')
news('depths-611-news', 'depths-611', 'Surge at the Depths gates', 5, ['Auvoth Compact', 'River Confederacy: Bluewatch'],
     'Breach salvage floods the Pale Market and the price of mana-hound hides drops. Two Sealwardens were buried on the Terrace without the usual bells. The Guild says it was routine.')

ev('who-pays-611', f"time() != null && time() >= {T(611, 'Emberwane', 10, 9)}",
   f'The Compact Council in Auvoth quarrels over who pays for the flood and the frontier forts. Highmark offers troops for the Auvoth road; Guildmaster Hendrikje Laan refuses, because foreign troops inside the walls are the Compact\'s red line. Council Speaker Aaltje Brouwer will not pay for forts she does not control. {UNSEEN}',
   then=[lasting('Who pays for the frontier', 'ongoing',
                 'The Compact Council quarrels over the cost of the flood and the forts. Highmark offers troops on the Auvoth road, and the Guild refuses them. The Confederacy will not pay for forts it does not control.',
                 'Auvoth', ['Compact Council', 'Highmark Empire', 'River Confederacy', 'Adventurer Guild'])])
news('who-pays-611-news', 'who-pays-611', 'Who pays for the frontier', 7, FRONT + BELT,
     'News from Auvoth: the Compact Council is quarrelling over who pays for the frontier. Highmark offered troops for the Auvoth road and the Guild turned them away. Duke Evert of Shorn is said to be furious.')

ev('turning-611-harsh', f"time() != null && time() >= {T(611, 'Frostfall', 25, 4)}",
   f'This year\'s Turning is harsher than most: a mammoth stampede reaches the Bluewatch road, and in the Border Kingdoms the village of Isbro burns. Frost wolves range further south than anyone remembers. It is still "just a bad Turning". {UNSEEN}',
   then=[lasting('A harsh Turning', 'ongoing',
                 'The CY 611 Turning is harsher than most. A mammoth stampede reached the Bluewatch road, and Isbro in the Border Kingdoms burned. Most still call it just a bad Turning.',
                 'Isbro', ['Border Kingdoms', 'The Long Watch'])])
ev('turning-611-scene', f"{window(T(611, 'Frostfall', 25, 4), T(611, 'Deepwinter', 6))} && {at(FRONT)}",
   'The beacons of the Long Watch burn down the line: stampede. Mammoths come through the taiga in a brown wall, with frost wolves running in their wake. Isbro in the Border Kingdoms has burned, and its people are on the road south with what they could carry. Every fort and village wants guards, and every refugee wants bread.',
   after='turning-611-harsh')
news('turning-611-news', 'turning-611-harsh', 'A harsh Turning', 10, BELT,
     'Word from the north: a hard Turning. A Border village burned, and the Bluewatch road was closed for days by a mammoth stampede. Highmark\'s quartermasters are buying winter grain early.')

ev('ledger-611', f"time() != null && time() >= {T(611, 'Yearsend', 20, 9)}",
   f"Debts come due at Yearsend, and this year the Grey Ledger is buying. The Reckoner's agents and the Nightingale's fences are quietly taking up frontier debts, war-supply contracts and grain futures from Shackles to Ledgerford. Someone expects a war, or a famine, and means to own it. {UNSEEN}",
   then=[lasting('The Grey Ledger buys the frontier', 'ongoing',
                 'At Yearsend the Grey Ledger and the Nightingale\'s fences are buying up frontier debts, war-supply contracts and grain futures. Someone expects a war or a famine.',
                 'Shackles City', ['Grey Ledger', 'Nightingale'])])

# === CY 612: "A migration" ===========================================================================================
ev('sealwardens-612', f"time() != null && time() >= {T(612, 'Rainmoot', 5, 9)}",
   f'After a second surge at the Depths gates, the Order of the Sealwardens opens its ranks: a one-year oath at 4 to 8 silver a day, and a month at the upper seals before any breach duty. Deserters hang on the Terrace. {UNSEEN}',
   then=[lasting('The Sealwardens open their ranks', 'ongoing',
                 'After a second surge at the Depths gates, the Sealwardens recruit: a one-year oath, 4 to 8 silver a day, and a month at the upper seals before breach duty.',
                 'Auvoth', ['Order of the Sealwardens', 'Adventurer Guild'])])
ev('sealwardens-612-scene', f"{window(T(612, 'Rainmoot', 5, 9), T(612, 'Greengale', 5))} && {at(['Auvoth Compact', 'River Confederacy: Bluewatch', 'Shornmarch'])}",
   'Sealwarden criers walk the roads with a lamp and a drum: "Light at the seal!" The Order is recruiting from every people. A one-year oath pays 4 to 8 silver a day, all salvage belongs to the Order, and recruits serve a month at the upper seals first. A character who takes the oath fits the Sealwarden recruit skills.',
   after='sealwardens-612')

ev('emperor-612-rumour', f"{window(T(612, 'Highsun', 10), T(612, 'Highsun', 18, 6))} && {at(HIGHMARK + ['Valegard', 'Wallwright League'])}",
   "The Emperor has not shown himself on the Crown Keep balcony for nine days. Physicians come and go by the river gate, and the heralds say nothing. Princess Wendhild has cancelled her hunts, Prince Corvin's friends drink in the Noble Heights, and Lord-General Hasse is said to be on the road from Stoneford.")
ev('emperor-612', f"time() != null && time() >= {T(612, 'Highsun', 18, 6)}",
   f'Emperor Adalmar of Highmark dies in the Crown Keep. His only child, Princess Wendhild, is heir by the plain rule. Prince Corvin, his nephew, claims it by the male-line reading. Lord-General Hasse holds the Southmarch army. The Diet has ratified no one. {UNSEEN}',
   then=[lasting('Emperor Adalmar is dead', 'resolved',
                 'Emperor Adalmar of Highmark died in the Crown Keep in Highsun CY 612. The Diet has ratified no successor.',
                 'Highmark Capital', ['Highmark Empire']),
         lasting("Highmark's succession", 'ongoing',
                 'Three claim the throne: Princess Wendhild by the plain rule, Prince Corvin by the male-line reading, Lord-General Hasse by the army. The Diet, the army and the Church must settle it.',
                 'Highmark Capital', ['Princess Wendhild', 'Prince Corvin', 'Lord-General Hasse', 'Imperial Diet'], keep=True)])
ev('emperor-612-scene', f"{window(T(612, 'Highsun', 18, 6), T(612, 'Highsun', 25))} && {at(HIGHMARK)}",
   "Every bell in Highmark tolls: the Emperor is dead. Heralds read the mourning order, but in the taverns it is all claims. The princess has the law, the prince has the old charter's words, and the Lord-General has the army. The Diet sits tomorrow. Anyone with a sword, a secret or a vote is suddenly worth courting.",
   after='emperor-612')
news('emperor-612-news-near', 'emperor-612', 'Emperor Adalmar is dead', 3, ['Valegard', 'Wallwright League', 'Kingdom of Ashmere', 'River Confederacy: core cities', 'Startrace Tower'],
     'The imperial relay brings it: Emperor Adalmar is dead, and Highmark has three claimants and no ratified heir. Everyone with money in Highmark is counting it.')
news('emperor-612-news-north', 'emperor-612', 'Emperor Adalmar is dead', 14, FRONT + ['Ironanvil', 'Aurelion/Church Heartland', 'Silver Mark', 'River Confederacy: locks/connectors'],
     "News comes north at last: the Emperor of Highmark is dead, and the princess, the prince and the Lord-General all claim the throne. Old soldiers say it will come to swords. In Auvoth, the Compact Council wonders who will pay for anything now.")
news('emperor-612-news-far', 'emperor-612', 'Emperor Adalmar is dead', 30, SOUTH + WEST + SEA,
     'Distant news: the Emperor of Highmark is dead, and his heirs are quarrelling over the throne. Here it is mostly a price change. Highmark coin trades lower, and mercenary captains are packing.')

ev('ardelia-612', f"time() != null && time() >= {T(612, 'Goldwane', 30, 12)}",
   f'Emperor Liutmar of Rhunwald\'s 18-year term ends in Osterhal, and the nine electors deadlock: no candidate reaches six votes. As the constitution requires, Arch-Chancellor Gerlinde rules as regent, with no wars, no new levies and no land grants. The Knights of the Last Day see Liutmar out. {UNSEEN}',
   then=[lasting("Ardelia's electors deadlock", 'ongoing',
                 "Emperor Liutmar's term ended, and the electors deadlocked. Arch-Chancellor Gerlinde rules Ardelia as regent: no wars, no new levies, no land grants. The south stays out of the north's troubles.",
                 'Osterhal', ['Ardelian Empire', 'Knights of the Last Day'])])
ev('ardelia-612-scene', f"{window(T(612, 'Goldwane', 30, 12), T(612, 'Haywane', 10))} && {at(['Ardelian Empire and Southmarch'])}",
   "In Osterhal the Knights of the Last Day escort Emperor Liutmar out of the Ninefold Hall at sunset, as the law demands. The count stalls short of six. Arch-Chancellor Gerlinde takes the regency: no wars, no levies. Belisar's vote is for sale, and the Lesser Estates' delegate has been seen dining with Highmark agents.",
   after='ardelia-612')
news('ardelia-612-news', 'ardelia-612', "Ardelia's electors deadlock", 20, HIGHMARK + ['Valegard', 'River Confederacy: core cities', 'Startrace Tower'],
     "News from the south: Ardelia's electors could not agree, and a regent rules there with her hands tied. Whatever happens in Highmark, Ardelia will not march.")

ev('inquest-612', f"time() != null && time() >= {T(612, 'Haywane', 15, 9)}",
   f'High Pontiff Gratian blames the Ashen Veil and necromancy for the risen dead along the northern frontier. Mother Inquisitor Severa, "Ash-Tongue", rides north with inquisitors and Silver Mark knights. Conclave Elder Clementia protests that the dead rise because the north is dying, and is ignored. {UNSEEN}',
   then=[lasting('The Inquest rides north', 'ongoing',
                 'The High Pontiff blames the Ashen Veil for the risen dead in the north. Mother Inquisitor Severa leads inquisitors and Silver Mark knights north. The Restorationists object and are ignored.',
                 'Holy City of Aurelion', ['Church of the Eternal Flame', 'Ashen Veil', 'Order of the Silver Mark'])])
news('inquest-612-news', 'inquest-612', 'The Inquest rides north', 14, FRONT,
     'Inquisitors arrive with Silver Mark knights, asking about unburied dead, grave-robbers and anyone who absorbs too well. Lay sealers are questioned. Strangers with Ashen Veil salts are hanged at the crossroads. Mother Inquisitor Severa\'s name makes people lower their voices.')

ev('turning-612', f"time() != null && time() >= {T(612, 'Frostfall', 24, 4)}",
   f'The CY 612 Turning brings people as well as herds: Frostbound bands under Ketil Ice-Oar raid south through the Border Kingdoms, and White-Horn herds cross the passes far earlier than usual. Learned people call it a great migration. {UNSEEN}',
   then=[lasting('The Frostbound come south', 'ongoing',
                 'In the CY 612 Turning, Frostbound bands raid south through the Border Kingdoms and White-Horn herds cross early. Scholars call it a great migration.',
                 'Border Kingdoms', ['Frostbound Tribes', 'White-Horn Clans', 'The Long Watch'])])
ev('turning-612-scene', f"{window(T(612, 'Frostfall', 24, 4), T(612, 'Deepwinter', 8))} && {at(FRONT)}",
   'The Long Watch\'s beacons burn two colours: stampede, and raiders. Frostbound warbands come south, but they bring their families, sleds and herds. Some raid, and some only ask to pass. Captured raiders swear something worse than winter is behind them. Commander Ragna of Kolsbotn wants every scout she can hire.',
   after='turning-612')
news('turning-612-news', 'turning-612', 'The Frostbound come south', 12, BELT,
     'News from the north: the Frostbound are raiding south in strength, with their families, and the White-Horn herds are in the Border Kingdoms. Scholars at Startrace call it a great migration. Startrace has said nothing more.')

# === CY 613: "The full picture" ======================================================================================
ev('cinder-613', f"time() != null && time() >= {T(613, 'Greengale', 10, 6)}",
   f'With Highmark\'s armies looking to their own throne, the Cinder Host comes out of the Western Barrens into the Northern Belt. Warmother Vashka leads, and Grusk the Ledger-Burner rides at the front, freeing slaves and burning every debt register and title deed. {UNSEEN}',
   then=[lasting('The Cinder Host marches', 'ongoing',
                 "The Cinder Host has left the Western Barrens to raid the Northern Belt while Highmark's armies look to the throne. It frees slaves and burns every debt register and title deed.",
                 'Hallowden', ['Cinder Host', 'Highmark Empire'])])
ev('cinder-613-scene', f"{window(T(613, 'Greengale', 10, 6), T(613, 'Highsun', 10))} && {at(['Western Barrens', 'Shackles', 'Wallwright League', 'Highmark Empire'])}",
   'Smoke on the western roads: the Cinder Host is out of the Barrens. Caravans turn back, and slave-holders bury their papers. Grusk the Ledger-Burner has burned Hallowden\'s tax court with the clerks still arguing inside. Runaways and deserters walk west to join the Host, and every garrison is somewhere else.',
   after='cinder-613')
news('cinder-613-news', 'cinder-613', 'The Cinder Host marches', 12, FRONT + ['River Confederacy: core cities', 'Valegard', 'Kingdom of Ashmere'],
     "News from the west: the Cinder Host has broken out of the Barrens and is burning ledgers in Highmark's western towns. Bankers in Ledgerford are moving their vaults.")

ev('succession-613', f"time() != null && time() >= {T(613, 'Goldwane', 5, 6)}",
   f'Highmark\'s succession becomes open war. Wendhild, Corvin and Hasse field armies on the Imperial North\'s roads. The Hand of Oblivion is said to hold contracts on all three. Every side bids for Wallwright engineers and Ironanvil steel. {UNSEEN}',
   then=[lasting("Highmark's war of succession", 'ongoing',
                 "Highmark's succession is open war between Princess Wendhild, Prince Corvin and Lord-General Hasse. The Hand of Oblivion is said to hold contracts on all three.",
                 'Highmark Capital', ['Princess Wendhild', 'Prince Corvin', 'Lord-General Hasse'])])
ev('succession-613-scene', f"{window(T(613, 'Goldwane', 5, 6), T(613, 'Goldwane', 20))} && {at(HIGHMARK + ['Valegard', 'Wallwright League'])}",
   "War in the Imperial North: banners of three claimants on the same roads, levies seized from the fields, and bridges held for tolls. Each side wants scouts, couriers and swords, and pays in promises. Rumour says the Quiet Hour, the Hand's most famous Executor, has taken a contract on one of the heirs, and every camp doubles its guards.",
   after='succession-613')
news('succession-613-news', 'succession-613', "Highmark's war of succession", 10, FRONT + SOUTH + WEST + SEA + ['Ironanvil', 'Aurelion/Church Heartland', 'Silver Mark', 'River Confederacy: core cities', 'River Confederacy: locks/connectors', 'Kingdom of Ashmere', 'Startrace Tower'],
     "News: Highmark's heirs have gone to war with each other. No help will come from the Empire this year. Prices for steel, horses and mercenaries have doubled.")

# Marrowbridge: the claimant with the least court favour is broken. Ties break against the later name in the plain
# order (Wendhild, then Corvin, then Hasse). With no Court favour module, Corvin is broken.
w, c, h = fav('wendhild'), fav('corvin'), fav('hasse')
MB = T(613, 'Haywane', 20, 8)
MB_CORVIN = f"({NOFAV} || ({c} < {h} && {c} <= {w}))"
MB_HASSE = f"({FAV} != null && {h} <= {w} && {h} <= {c})"
MB_WEND = f"({FAV} != null && {w} < {c} && {w} < {h})"
MARROW = {
    'corvin': (MB_CORVIN, 'Prince Corvin falls at Marrowbridge',
               'At the Battle of Marrowbridge, Prince Corvin was killed and his army broken. Princess Wendhild and Lord-General Hasse remain.',
               'Prince Corvin falls at the Battle of Marrowbridge: his army breaks at the bridge, and he dies under his own banner. The war for the throne is now Princess Wendhild against Lord-General Hasse.'),
    'hasse': (MB_HASSE, 'Lord-General Hasse broken at Marrowbridge',
              'At the Battle of Marrowbridge, Lord-General Hasse was broken. The Marchriders scattered, and he fled south in disgrace. Princess Wendhild and Prince Corvin remain.',
              'Lord-General Hasse is broken at the Battle of Marrowbridge: the Marchriders scatter, and Hasse flees south toward Stoneford in disgrace. The war for the throne is now Princess Wendhild against Prince Corvin.'),
    'wendhild': (MB_WEND, 'Princess Wendhild flees to the Last Wall',
                 'At the Battle of Marrowbridge, Princess Wendhild\'s army was broken. She fled north to Thornwall Redoubt, where the Wardens of the Last Wall shelter her. Prince Corvin and Lord-General Hasse remain.',
                 "Princess Wendhild's army is broken at the Battle of Marrowbridge. Dame Ermengild cuts her a way out, and she flees north to Thornwall Redoubt, where the Wardens of the Last Wall shelter her and swear to her blood. The war for the throne is now Prince Corvin against Lord-General Hasse."),
}
for who, (cond, name, summary, cue) in MARROW.items():
    ev(f'marrowbridge-{who}', f"time() != null && time() >= {MB} && {cond}", f'{cue} {UNSEEN}', after='succession-613',
       then=[lasting(name, 'resolved', summary, 'Marrowbridge', ['Highmark Empire'])])
    ev(f'marrowbridge-{who}-scene', f"{window(MB, T(613, 'Haywane', 27))} && {at(HIGHMARK)}",
       f'The battle at Marrowbridge is over, and the river runs dark. {cue} Wounded crowd the road, looters work the field, and both surviving camps are hiring anyone who can hold a spear.',
       after=f'marrowbridge-{who}')
    news(f'marrowbridge-{who}-news', f'marrowbridge-{who}', name, 12, FRONT + BELT[1:] + SOUTH,
         f'News of a great battle at Marrowbridge in Highmark: {name}. The war for the throne goes on, and the camps are hiring.')

ev('livia-613', f"{window(T(613, 'Frostfall', 1), T(613, 'Frostfall', 20))} && {at(FRONT)}",
   'Saintess Livia, "Candle-Without-Smoke", has come north with a train of pilgrims and Silver Mark guards to lay the frontier\'s dead to rest. Wherever she stops, the uneasy graves go quiet and crowds gather. The inquisitors are polite to her, and visibly unhappy.')

ev('turning-613', f"time() != null && time() >= {T(613, 'Frostfall', 22, 4)}",
   f'The CY 613 Turning is unmistakable. The Frostbound and White-Horn lands are overrun by beasts and storms no migration explains, and Frost Queen Eydis Long-Winter leads her whole people south toward the Border Kingdoms. Long Watch scouts bring back proof from the far north. {UNSEEN}',
   then=[lasting('The north is lost', 'ongoing',
                 'In the CY 613 Turning, the Frostbound and White-Horn lands were overrun. Frost Queen Eydis Long-Winter leads her people south. Refugees fill the Border Kingdoms.',
                 'Border Kingdoms', ['Frostbound Tribes', 'White-Horn Clans', 'The Long Watch', 'Border Kingdoms'], keep=True)])
ev('turning-613-scene', f"{window(T(613, 'Frostfall', 22, 4), T(613, 'Deepwinter', 10))} && {at(FRONT)}",
   'This is no Turning. Whole Frostbound clans walk south under the Frost Queen\'s war-seat, with White-Horn mammoths among them, and behind them the northern sky flickers a colour no one can name. Kaidu Thrice-Returned comes back from the tundra edge and says flatly: this is not a migration. The refugee camps need food, guards and healers.',
   after='turning-613')
news('turning-613-news', 'turning-613', 'The north is lost', 12, BELT + SOUTH,
     'Terrible news from the north: the Frostbound and the White-Horn Clans have been driven out of their lands, and their whole peoples are coming south. No one agrees on why.')

ev('tide-613', f"time() != null && time() >= {T(613, 'Deepwinter', 12, 10)}",
   f'In Auvoth, Commander Ragna of Kolsbotn lays Master Albrecht Somner\'s journal before the Compact Council. It was found in his abandoned camp on the Hollow Aurora Expedition route: a Startrace expedition tapped the Hollow Aurora\'s leyline in CY 610. The Guild and the Long Watch name it the Third Abyssal Tide. The Council splits over who pays. {UNSEEN}',
   then=[lasting('The Third Abyssal Tide', 'ongoing',
                 "The Long Watch found Master Somner's journal: a Startrace expedition tapped the Hollow Aurora's leyline in CY 610. The Guild and the Long Watch name the Third Abyssal Tide, and the Council is split.",
                 'Auvoth', ['Adventurer Guild', 'The Long Watch', 'Startrace Tower', 'Compact Council'], keep=True)])
ev('tide-613-scene', f"{window(T(613, 'Deepwinter', 12, 10), T(613, 'Deepwinter', 20))} && {at(['Auvoth Compact', 'River Confederacy: Bluewatch'])}",
   "The Compact Council hall is packed: Commander Ragna reads from a frost-stained Startrace journal. A survey team went beyond the Iron-Blue Tundra, tapped the leyline under the Pale Orbit's light, and wrote that the ice sang back. Guildmaster Hendrikje Laan names it the Third Abyssal Tide. The delegates shout, and Highmark's seat is empty.",
   after='tide-613')
news('tide-613-news-belt', 'tide-613', 'The Third Abyssal Tide', 10, BELT,
     "The word spreads from Auvoth: the Third Abyssal Tide. Startrace's Archmaster denies sending any expedition, then stops answering letters. Conclave Elder Clementia preaches in the streets of the Holy City, and this time crowds listen.")
news('tide-613-news-far', 'tide-613', 'The Third Abyssal Tide', 30, SOUTH + WEST + SEA,
     "Strange news from the far north: the Guild says an Abyssal Tide is rising beyond Auvoth. The elves say nothing. Merchants say it is a Guild trick to raise contract prices. The Sea God Witch of Atlantis has asked for northern charts.")

ev('chain-613', f"time() != null && time() >= {T(613, 'Icewane', 8, 3)}",
   f'At Eastvale in Highmark, refugees and slaves pressed into building northern defences rise. Neshai Chainbreaker breaks the slave pens and burns the registers, and the Key-Widow\'s name is chalked on every wall. The uprising spreads along the work camps. {UNSEEN}',
   then=[lasting('The Broken Chain rises', 'ongoing',
                 "At Eastvale, refugees and slaves pressed into building the northern defences rose. Neshai Chainbreaker broke the slave pens, and the Key-Widow's name is on every wall.",
                 'Eastvale', ['Broken Chain', 'Highmark Empire'])])
ev('chain-613-scene', f"{window(T(613, 'Icewane', 8, 3), T(613, 'Icewane', 20))} && {at(HIGHMARK + ['Valegard'])}",
   'Eastvale is burning: collared work gangs from the northern defences have turned on their overseers, and the slave pens stand open. A beastfolk woman breaks collars with her bare hands in the market square. Slave-catchers are hiring, freed workers need guides south, and nobody is building any walls.',
   after='chain-613')
news('chain-613-news', 'chain-613', 'The Broken Chain rises', 12, FRONT + SOUTH + WEST + ['River Confederacy: core cities', 'Kingdom of Ashmere', 'Aurelion/Church Heartland'],
     "News: the Broken Chain has risen at Eastvale in Highmark, and the slaves building the northern defences are free and armed. Shackles has put a price on Neshai Chainbreaker's head.")

# === CY 614: the crowning and the fall of Auvoth ======================================================================
CR = T(614, 'Rainmoot', 1, 10)
CROWN = {
    # (broken at Marrowbridge, winner, loser): winner by favour among the two left; ties by the plain order.
    ('corvin', 'wendhild', 'hasse'): f"({NOFAV} || {w} >= {h})",
    ('corvin', 'hasse', 'wendhild'): f"({FAV} != null && {h} > {w})",
    ('hasse', 'wendhild', 'corvin'): f"({NOFAV} || {w} >= {c})",
    ('hasse', 'corvin', 'wendhild'): f"({FAV} != null && {c} > {w})",
    ('wendhild', 'corvin', 'hasse'): f"({NOFAV} || {c} >= {h})",
    ('wendhild', 'hasse', 'corvin'): f"({FAV} != null && {h} > {c})",
}
TITLE = {'wendhild': 'Princess Wendhild', 'corvin': 'Prince Corvin', 'hasse': 'Lord-General Hasse'}
CROWNED = {'wendhild': 'Empress Wendhild', 'corvin': 'Emperor Corvin', 'hasse': 'Emperor Hasse'}
LOSER = {
    'hasse': 'Lord-General Hasse kneels in exchange for the Southmarch, and the Wardens of the Last Wall never forgive him for asking.',
    'corvin': 'Prince Corvin rides south to Stoneford with what friends he has left, and swears he will be back.',
    'wendhild': "Princess Wendhild refuses to kneel and stays under the Wardens' protection at Thornwall Redoubt.",
}
AFTER_CROWN = {
    'wendhild': 'She turns the Empire north at once: levies to the Auvoth road, Wallwright engineers to the passes, and steel bought from Ironanvil on credit.',
    'corvin': "He turns the Empire south: the Southmarch Road and Ardelia's undefended regency are the war he always wanted, and the north gets what is left.",
    'hasse': "The Wardens of the Last Wall refuse to kneel to a general's crown. Hasse answers by threatening to open the Iron Archive and break the Dawn-King's bloodline's claim for ever.",
}
for (broken, win, lose), cond in CROWN.items():
    name = f'Highmark crowns {CROWNED[win]}'
    cue = f'The Diet ratifies {TITLE[win]}, crowned {CROWNED[win]} of Highmark in the Crown Keep. {LOSER[lose]} {AFTER_CROWN[win]}'
    ev(f'crown-{win}-over-{lose}', f"time() != null && time() >= {CR} && {cond}", f'{cue} {UNSEEN}', after=f'marrowbridge-{broken}',
       then=[lasting(name, 'resolved', f'{CROWNED[win]} was crowned in Rainmoot CY 614. {AFTER_CROWN[win]}'[:240],
                     'Highmark Capital', ['Highmark Empire'], keep=True),
             lasting("Highmark's war of succession", 'resolved', f'The war of succession ended with {CROWNED[win]} crowned in CY 614.'),
             lasting("Highmark's succession", 'resolved', f'{CROWNED[win]} was crowned in Rainmoot CY 614.')])
    ev(f'crown-{win}-over-{lose}-scene', f"{window(CR, T(614, 'Rainmoot', 10))} && {at(HIGHMARK)}",
       f'Highmark crowns a ruler. {cue}', after=f'crown-{win}-over-{lose}')
for win in ['wendhild', 'corvin', 'hasse']:
    name = f'Highmark crowns {CROWNED[win]}'
    news(f'crown-{win}-news', None, name, 14, FRONT + BELT[1:] + SOUTH,
       f'News from Highmark: the war of succession is over, and {CROWNED[win]} is crowned. {AFTER_CROWN[win]}')

ev('hasse-archive-614', f"time() != null && {since('Highmark crowns Emperor Hasse', 40 * DAY)}",
   f'Emperor Hasse sends men to the Iron Archive beneath Highmark Capital and summons an Ironanvil reading elder. The High Pontiff warns that opening it would be Highmark\'s ruin, and the Diet is terrified. Whatever is inside, Hasse means to use it against the Dawn-King\'s bloodline. {UNSEEN}',
   then=[lasting('The Iron Archive threatened', 'ongoing',
                 'Emperor Hasse has ordered the Iron Archive opened and summoned an Ironanvil reading elder, to break the Dawn-King\'s bloodline\'s claim. The Church and the Diet are in uproar.',
                 'Highmark Capital', ['Highmark Empire', 'Church of the Eternal Flame', 'Ironanvil Holds'])])
ev('corvin-south-614', f"time() != null && {since('Highmark crowns Emperor Corvin', 60 * DAY)}",
   f"Emperor Corvin marches down the Southmarch Road toward Varden and Osterhal, against Ardelia's tied-handed regency. Highmark's best regiments go south, not north. {UNSEEN}",
   then=[lasting('Highmark marches on Ardelia', 'ongoing',
                 "Emperor Corvin marches down the Southmarch Road against Ardelia's regency. Highmark's best regiments go south while the Tide comes from the north.",
                 'Stoneford', ['Highmark Empire', 'Ardelian Empire'])])
ev('wendhild-north-614', f"time() != null && {since('Highmark crowns Empress Wendhild', 40 * DAY)}",
   f'Empress Wendhild\'s armies march north: Highmark levies on the Auvoth road, Wallwright engineers under First Marshal Adelind Corbel in the passes, and the Wardens of the Last Wall at Thornwall Redoubt. For the first time, the north is not alone. {UNSEEN}',
   then=[lasting('Highmark turns north', 'ongoing',
                 "Empress Wendhild sends Highmark's armies north to hold the passes, with Wallwright engineers and the Wardens of the Last Wall.",
                 'Thornwall Redoubt', ['Highmark Empire', 'Wallwright League', 'Wardens of the Last Wall'])])

ev('troops-auvoth-614', f"time() != null && time() >= {T(614, 'Highsun', 10, 10)}",
   f'For the first time since the Compact was sworn, the Council votes to let foreign troops inside Auvoth\'s walls: Confederacy regiments, Border levies and whatever Highmark sends. Guildmaster Hendrikje Laan votes for it and says it is the worst day of her life. {UNSEEN}',
   then=[lasting("Armies inside Auvoth's walls", 'ongoing',
                 "The Compact Council broke its own red line and let foreign troops inside Auvoth's walls to hold the city against the Tide.",
                 'Auvoth', ['Compact Council', 'Adventurer Guild', 'River Confederacy', 'Border Kingdoms'])])
ev('troops-auvoth-614-scene', f"{window(T(614, 'Highsun', 10, 10), T(614, 'Highsun', 25))} && {at(['Auvoth Compact', 'River Confederacy: Bluewatch'])}",
   "Soldiers march through the Outer Lamps under foreign banners, and Auvoth's people watch in silence. Guild wardens and Confederacy sergeants argue over who keeps the streets. Everyone is building, digging and stockpiling. The Pale Market sells weapons by the cartload.",
   after='troops-auvoth-614')

AUVOTH_LATE = T(614, 'Frostfall', 25, 4)
AUVOTH_EARLY = T(614, 'Nightfall', 12, 4)
FALL_CUE = ('The Tide reaches Auvoth. The city is evacuated down the Bluewatch road under the never-out lamps, then overrun. Guildmaster Hendrikje Laan governs the Guild in exile from Shorn. Seal-Captain Gurda Kelthul and her Sealwardens stay behind at the Seventh Seal Terrace to hold the seals. Bluewatch is abandoned, and its signal tower burns as the last warning.')
FALL_SUMMARY = ('The Tide overran Auvoth after its evacuation. The Guild governs in exile from Shorn. The Sealwardens stayed behind to hold the seals. Bluewatch was abandoned.')
ev('auvoth-falls-early', f"time() != null && time() >= {AUVOTH_EARLY} && {since('Highmark crowns Emperor Corvin')}",
   f'With Highmark\'s armies gone south, the north cannot hold, and the Tide comes early. {FALL_CUE}',
   then=[lasting('Auvoth is lost', 'resolved', FALL_SUMMARY, 'Auvoth', ['Adventurer Guild', 'Order of the Sealwardens', 'Compact Council'], keep=True)])
ev('auvoth-falls', f"time() != null && time() >= {AUVOTH_LATE} && !{since('Auvoth is lost')}",
   FALL_CUE,
   then=[lasting('Auvoth is lost', 'resolved', FALL_SUMMARY, 'Auvoth', ['Adventurer Guild', 'Order of the Sealwardens', 'Compact Council'], keep=True)])
ev('auvoth-evacuation-scene', f"time() != null && {since('Auvoth is lost')} && !{since('Auvoth is lost', 7 * DAY)} && {at(['Auvoth Compact', 'River Confederacy: Bluewatch', 'Shornmarch'])}",
   'The evacuation of Auvoth: an endless line of carts, wounded, adventurers and clerks carrying the Guild\'s registers down the Bluewatch road, with the northern sky flickering behind them. Sealwardens stand at the Terrace gates with lamps, not leaving. Whoever is still in the city must run, fight, or stay with them.')
ev('auvoth-ruins-visit', f"time() != null && {since('Auvoth is lost', 8 * DAY)} && {at(['Auvoth Compact', 'River Confederacy: Bluewatch'])}",
   "The north is the Tide's now. Auvoth's walls stand, but the city is overrun and wrong: frost on stone in summer, beasts in the Pale Market, storms that walk. Only at the Seventh Seal Terrace does a light still burn, where the Sealwardens hold the seals. Coming here is a death sentence for most.")
news('auvoth-falls-news', None, 'Auvoth is lost', 7, BELT,
     "Auvoth has fallen. The Guild's city is evacuated and overrun, and the Guild governs from Shorn. People say the Sealwardens stayed behind with their lamps. Every road south is full of refugees, and every crown is suddenly listening to the Guild.")
news('auvoth-falls-news-far', None, 'Auvoth is lost', 25, SOUTH + WEST + SEA,
     "News that silences taverns even here: Auvoth, the Guild's city, has fallen to the Tide in the north. Contract prices everywhere double, and the Guild is calling in every member in good standing.")

# === CY 615: the Last Wall ===========================================================================================
LW = T(615, 'Frostfall', 21, 4)
LAST_WALL = {
    'wendhild': "Empress Wendhild's armies hold the passes behind them, and the Wardens stand in front.",
    'corvin': "Emperor Corvin's regiments are in the south, and the Wardens hold almost alone, with Border levies and whatever the Guild can send.",
    'hasse': "The Wardens never knelt to Emperor Hasse; they hold the Wall 'for the Dawn-King's blood, not for him', and his regiments fight beside them without a word.",
}
for win, line in LAST_WALL.items():
    ev(f'last-wall-{win}', f"time() != null && time() >= {LW} && {since(f'Highmark crowns {CROWNED[win]}')}",
       f'The Tide reaches the Last Wall, the northern roads above Thornwall Redoubt. {line} Lord-Commander Ottwald, Dame Ermengild and Sir Volkmar "the Old Stone" fall with the Wardens of the Last Wall, until the last stone. The Tide is held there, at that cost. {UNSEEN}',
       then=[lasting('The Last Wall holds', 'resolved',
                     'The Wardens of the Last Wall held the northern roads above Thornwall Redoubt until the last stone. Lord-Commander Ottwald, Dame Ermengild and Sir Volkmar fell with the order. The Tide was held there.',
                     'Thornwall Redoubt', ['Wardens of the Last Wall', 'Highmark Empire'], keep=True)])
ev('last-wall-scene', f"time() != null && {since('The Last Wall holds')} && !{since('The Last Wall holds', 10 * DAY)} && {at(HIGHMARK + ['Border Kingdoms', 'Shornmarch', 'River Confederacy: Bluewatch'])}",
   "The Last Wall: a broken road under black ice, the Wardens' banners still up over heaps of stone and dead things. The Tide has stopped here and does not move. Survivors carry Sir Volkmar's shield south. Everyone who stood there is a legend now, and everyone who did not wants to be told about it.")
news('last-wall-news', None, 'The Last Wall holds', 14, ALL,
     'News that the world will remember: the Wardens of the Last Wall are gone, every one, and the Tide is held at their wall. In every Highmark town, bells ring for Lord-Commander Ottwald, Dame Ermengild and Sir Volkmar. "Until the last stone" is chalked on doors.')

ev('after-wall-616', f"time() != null && {since('The Last Wall holds', 90 * DAY)}",
   f'After the Last Wall, a new frontier runs south of Bluewatch and the Border Kingdoms. Refugee Frostbound and White-Horn clans settle where crowns let them, the Guild rules from Shorn, and the Depths lie behind the Tide. Some nights, from the Shorn walls, a single lamp can still be seen burning far to the north. {UNSEEN}',
   then=[lasting('After the Last Wall', 'ongoing',
                 'A new frontier runs south of Bluewatch and the Border Kingdoms. Refugee clans settle where they can, and the Guild rules from Shorn. The Sealwardens\' lamp still burns at the Seventh Seal Terrace.',
                 'Shorn', ['Adventurer Guild', 'Frostbound Tribes', 'White-Horn Clans', 'Border Kingdoms'])])

# --- the Court favour module ------------------------------------------------------------------------------------------
CLAIMANTS = ['wendhild', 'corvin', 'hasse']
SIZE = {'type': 'enum', 'values': ['small', 'great']}
WHO = {'type': 'enum', 'values': CLAIMANTS}
SUCCESSION = {
    'slug': 'succession', 'name': 'Court favour', 'schema': 1, 'stateVersion': 1, 'scope': 'chat',
    'prompt': ("Highmark's court: how much favour each claimant to the throne holds (Princess Wendhild, Prince Corvin, "
               "Lord-General Hasse). Write a line only when the player's own deeds clearly win or cost a claimant support at "
               "court or in the field; never for news alone."),
    'state': {'wendhild': {'type': 'int', 'min': 0, 'max': 100, 'default': 40},
              'hasse': {'type': 'int', 'min': 0, 'max': 100, 'default': 35},
              'corvin': {'type': 'int', 'min': 0, 'max': 100, 'default': 25}},
    'rewards': {
        'support': {'bindings': {'claimant': WHO, 'size': SIZE},
                    'values': {'amount': {'binding': 'size', 'table': {'small': {'min': 2, 'max': 4, 'pick': 'midpoint'}, 'great': {'min': 6, 'max': 12, 'pick': 'midpoint'}}}},
                    'effects': [{'op': 'add', 'path': [['bind', 'claimant']], 'value': ['reward', 'amount'], 'bounds': 'clamp'}]},
        'harm': {'bindings': {'claimant': WHO, 'size': SIZE},
                 'values': {'amount': {'binding': 'size', 'table': {'small': {'min': 2, 'max': 4, 'pick': 'midpoint'}, 'great': {'min': 6, 'max': 12, 'pick': 'midpoint'}}}},
                 'effects': [{'op': 'add', 'path': [['bind', 'claimant']], 'value': ['mul', ['reward', 'amount'], -1], 'bounds': 'clamp'}]},
    },
    'kinds': {
        'back': {'op': '+', 'oncePerReply': ['claimant'], 'labels': {'claimant': WHO, 'size': SIZE},
                 'effects': [{'op': 'reward', 'template': 'support', 'bind': {'claimant': ['arg', 'claimant'], 'size': ['arg', 'size']}}]},
        'undermine': {'op': '-', 'oncePerReply': ['claimant'], 'labels': {'claimant': WHO, 'size': SIZE},
                      'effects': [{'op': 'reward', 'template': 'harm', 'bind': {'claimant': ['arg', 'claimant'], 'size': ['arg', 'size']}}]},
    },
}

SKILL_SET = {
    'name': 'Sealwarden recruit',
    'about': 'Sworn to the Order of the Sealwardens for a year: a month at the upper seals, then the gates of the Auvoth Depths.',
    'skills': [
        {'name': 'Gate spear', 'about': 'Holding a gate or a stair with a long spear, shoulder to shoulder, against what comes up.', 'stat': 'str'},
        {'name': 'Ward-reading', 'about': 'Reading the seals and wards on a door, and feeling when one strains.', 'stat': 'int', 'uses': 'mana'},
        {'name': 'Lamp-keeping', 'about': 'Keeping the never-out lamps burning through bad air, smoke, cold and long watches.', 'stat': 'vit'},
        {'name': 'Breach drill', 'about': 'Falling back in order through a gate before a swarm, and closing it behind the last.', 'stat': 'agi'},
        {'name': 'Gate challenge', 'about': 'Stopping parties at the descents, reading permits and spotting forged badges.', 'stat': 'cha'},
    ],
}


def line(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))


def main(path):
    text = open(path).read()
    ids = [e['id'] for e in EVENTS]
    assert len(set(ids)) == len(ids)
    def swap(old, new):
        nonlocal text
        assert text.count(old) == 1, old[:80]
        text = text.replace(old, new)
    swap('"version": "2.1.0",', '"version": "2.2.0",')
    swap('"capabilities": ["scene", "inventory", "data-modules-v1"]', '"capabilities": ["scene", "inventory", "data-modules-v1", "chronicle-lasting"]')
    end = text.index('\n    ],\n    "dataModules": [')
    text = text[:end] + ',\n' + ',\n'.join('      ' + line(e) for e in EVENTS) + text[end:]
    mods_end = text.index('\n    ]\n  },\n  "start": {')
    text = text[:mods_end] + ',\n      ' + line(SUCCESSION) + '\n    ],\n    "rpg": {\n      "skillSets": [\n        ' + line(SKILL_SET) + '\n      ]\n    }' + text[mods_end + len('\n    ]'):]
    json.loads(text)
    with open(path, 'w') as out:
        out.write(text)
    print(len(EVENTS), 'events added')


if __name__ == '__main__':
    main(sys.argv[1])
