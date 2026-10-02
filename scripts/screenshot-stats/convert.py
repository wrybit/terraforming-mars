"""Merges the screenshot data read off with the chart values and translates names into English.
Result per screenshot: screenshot-details/<id>.json in the format the server reads as StatsGameDetails."""
import argparse, json, glob, os, re, difflib
from charts import extract

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--screenshots', required=True, help='Folder with <id>.jpg and imported-games.json (from the server)')
parser.add_argument('--extracted', required=True, help='Folder with the read-off <id>.json (see INSTRUCTIONS.md)')
parser.add_argument('--out', required=True, help='Target folder, contents belong in db/imported/screenshot-details/')
parser.add_argument('--locales', default='assets/locales/de.json', help='Translations (after npm run make:json)')
args = parser.parse_args()
SCREENSHOTS = args.screenshots
MILESTONES = ['Terraformer', 'Mayor', 'Gardener', 'Planner', 'Builder', 'Generalist', 'Specialist', 'Ecologist', 'Tycoon', 'Legend', 'Diversifier', 'Tactician', 'Polar Explorer', 'Energizer', 'Rim Settler']
AWARDS = ['Landlord', 'Scientist', 'Banker', 'Thermalist', 'Miner', 'Celebrity', 'Industrialist', 'Desert Settler', 'Estate Dealer', 'Benefactor', 'Contractor', 'Cultivator', 'Excentric', 'Magnate', 'Space Baron', 'Venuphile']
# Deviating spellings on the screenshots (older translations, UI typos)
MA_ALIASES = {'forschung': 'Scientist', 'wärmetechnicker': 'Thermalist', 'banker': 'Banker', 'tycoon': 'Tycoon', 'terraformer': 'Terraformer'}
CARD_ALIASES = {'asteroiden des hauptgürtels': None, 'neptunische energieberater': 'Neptunian Power Consultants'}

de = json.load(open(args.locales))
card_by_german = {}
for english, german in de.items():
    if german:
        card_by_german.setdefault(german.strip().lower(), english)
ma_by_german = {}
for english in MILESTONES + AWARDS:
    ma_by_german[english.lower()] = english
    if de.get(english):
        ma_by_german[de[english].strip().lower()] = english
ma_by_german.update(MA_ALIASES)

problems = []


def card_name(name, context):
    key = name.strip().lower()
    if key in CARD_ALIASES:
        if CARD_ALIASES[key] is None:
            problems.append(f'{context}: card "{name}" unknown, skipped')
        return CARD_ALIASES[key]
    if key in card_by_german:
        return card_by_german[key]
    if name in de:  # schon englisch
        return name
    match = difflib.get_close_matches(key, card_by_german.keys(), 1, 0.88)
    if match:
        problems.append(f'{context}: card "{name}" → "{card_by_german[match[0]]}" (similar)')
        return card_by_german[match[0]]
    problems.append(f'{context}: card "{name}" unknown, skipped')
    return None


def ma_name(name, context):
    english = ma_by_german.get(name.strip().lower())
    if english is None:
        problems.append(f'{context}: Meilenstein/Auszeichnung "{name}" unbekannt')
    return english


def seconds(text):
    if not text:
        return None
    parts = [int(part) for part in re.findall(r'\d+', text)]
    total = 0
    for part in parts:
        total = total * 60 + part
    return total


summaries = {summary['screenshotUrl'].split('=')[1]: summary for summary in json.load(open(f'{SCREENSHOTS}/imported-games.json')) if summary.get('screenshotUrl')}


def match_players(extracted, summary):
    """Match the screenshot's players to the players of the summary (names there are normalized)."""
    by_name = {player['name'].lower(): player['name'] for player in summary['players']}
    result = {}
    for player in extracted:
        name = by_name.get(player['name'].lower())
        if name is None:
            same_total = [p['name'] for p in summary['players'] if p['victoryPoints'] == (player['points'] or {}).get('total')]
            name = same_total[0] if len(same_total) == 1 else None
        result[player['name']] = name
    return result


os.makedirs(args.out, exist_ok=True)
for path in sorted(glob.glob(os.path.join(args.extracted, '*.json'))):
    data = json.load(open(path))
    screenshot_id = data['screenshotId']
    context = screenshot_id
    summary = summaries.get(screenshot_id)
    if summary is None:
        problems.append(f'{context}: no game in imported-games.json')
        continue
    names = match_players(data['players'], summary)
    if None in names.values() or len(set(names.values())) != len(names):
        problems.append(f'{context}: players cannot be matched unambiguously {names}')
        continue
    players, milestones, awards = [], [], {}
    for player in data['players']:
        name = names[player['name']]
        points = player.get('points') or {}
        card_points = []
        for card in player.get('cards') or []:
            english = card_name(card['name'], context)
            if english is not None:
                card_points.append({'name': english, 'points': card['points']})
        for milestone in player.get('milestones') or []:
            english = ma_name(milestone, context)
            if english:
                milestones.append({'name': english, 'playerName': name})
        for award in player.get('awards') or []:
            english = ma_name(award['name'], context)
            if not english:
                continue
            funder = names.get(award.get('funder')) or next((n for n in names.values() if n.lower() == str(award.get('funder')).lower()), None)
            entry = awards.setdefault(english, {'name': english, 'funderName': funder, 'winnerNames': [], 'secondNames': []})
            (entry['winnerNames'] if award['place'] == 1 else entry['secondNames']).append(name)
        victory_points = None
        if points.get('total') is not None:
            victory_points = {key: points.get(key) for key in ('terraformRating', 'milestones', 'awards', 'greenery', 'city', 'cards', 'total')}
            victory_points['other'] = sum((points.get('other') or {}).values())
        players.append({
            'name': name,
            'color': player.get('color'),
            'cards': [card['name'] for card in card_points],
            'cardPoints': card_points,
            'terraformRating': points.get('terraformRating'),
            'greeneries': points.get('greenery'),
            'victoryPoints': victory_points,
            'megaCredits': player.get('megaCredits'),
            'timeSeconds': seconds(player.get('time')),
            'actions': player.get('actions'),
        })
    details = {
        'source': 'screenshot',
        'cardsComplete': False,
        'boardName': data.get('board'),
        'expansions': ['venus'] if data.get('venus') else [],
        'players': players,
        'milestones': milestones,
        'awards': list(awards.values()),
    }
    # Charts: points per generation and global parameters
    generations = data.get('generations')
    colors = {player['name']: player['color'] for player in players}
    totals = {player['name']: (player['victoryPoints'] or {}).get('total') for player in players}
    if generations and all(colors.values()) and len(set(colors.values())) == len(colors) and all(totals.values()):
        try:
            charts = extract(f'{SCREENSHOTS}/{screenshot_id}.jpg', colors, generations, totals)
        except Exception as error:  # noqa: BLE001 – a broken image shouldn't hold up the rest
            charts = {'error': str(error)}
        if 'error' in charts:
            problems.append(f'{context}: charts not readable ({charts["error"]})')
        elif charts['endDeviation'] > 3:
            problems.append(f'{context}: point history deviates at the end by {charts["endDeviation"]}, discarded')
        else:
            for player in players:
                player['pointsByGeneration'] = charts['pointsByGeneration'][player['name']]
            details['globalsByGeneration'] = charts['globalsByGeneration']
    else:
        problems.append(f'{context}: without charts (generations/colors missing)')
    for player in players:
        player.pop('color')
    json.dump({'screenshotId': screenshot_id, 'gameId': data.get('gameId'), 'details': details}, open(os.path.join(args.out, f'{screenshot_id}.json'), 'w'), ensure_ascii=False, indent=1)

print(len(glob.glob(os.path.join(args.out, '*.json'))), 'Dateien')
print('\n'.join(problems))
