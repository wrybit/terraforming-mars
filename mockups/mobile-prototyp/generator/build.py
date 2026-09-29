"""Erzeugt den Mobil-Prototyp aus echten, im Browser gerenderten Spiel-Bausteinen.

Eingaben: capture/*.json (von den capture/*.mjs-Skripten aus dem laufenden Fork abgegriffen).
Ausgabe: <ziel>/index.html plus CSS, JS und Zusatzgrafiken – nie von Hand ändern, sondern hier.
Aufruf: python3 build.py [zielordner]
"""
import json
import re
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).parent
CAPTURE = HERE / 'capture'
SITE = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / 'site'


def load(name: str):
    return json.loads((CAPTURE / name).read_text())


FRAGMENTS = load('fragments.json')
PLAYED = load('played.json')
SETUP = load('setup.json')
SETUP_VALUES = load('setup-values.json')
PLACE_CITY = load('sp-City.json')
PLACE_OCEAN = load('sp-Aquifer.json')
END = load('end-parts.json')

# Echte Log-Einträge der Generationen 1–5 aus einem beendeten Spiel auf dem Server (Jens = blau, Martin = grün);
# im Prototyp als Jens (grün) und Mira (rot) gezeigt, der dritte Spieler fällt weg
REAL_LOG_PLAYERS = {'blue': ('Jens', 'green'), 'green': ('Mira', 'red')}
REAL_CARD_TYPES = load('realgame/card-types.json')
CARD_KIND = {'active': 'active', 'automated': 'automated', 'event': 'events', 'corporation': 'corporation', 'prelude': 'prelude'}

# Spielstand des Testspiels (so in der Datenbank gesetzt, siehe capture/edit.py)
GAME = {'generation': 6, 'oxygen': 5, 'temperature': -16, 'oceans': 4, 'timer': '01:22'}
PLAYERS = [
    {'id': 'jens', 'name': 'Jens', 'color': 'green', 'corp': 'Saturn Systems', 'tr': 31, 'cards': 7, 'self': True,
     'resources': [(46, 9), (6, 2), (4, 2), (9, 3), (3, 3), (8, 4)],
     'played': ['saturn-systems', 'space-elevator', 'development-center', 'mars-university', 'pets',
                'arctic-algae', 'tardigrades', 'ganymede-colony', 'power-plant']},
    {'id': 'mira', 'name': 'Mira', 'color': 'red', 'corp': 'Teractor', 'tr': 28, 'cards': 5, 'self': False,
     'resources': [(41, 11), (3, 3), (1, 1), (3, 2), (1, 2), (4, 2)],
     'played': ['teractor', 'asteroid', 'big-asteroid', 'ironworks', 'mine', 'ice-asteroid',
                'power-plant', 'search-for-life']},
]
RESOURCES = ['megacredits', 'steel', 'titanium', 'plants', 'energy', 'heat']
RESOURCE_BADGES = {'steel': 2, 'titanium': 3}

# Reiter des Originals -> Schlüssel, Symbol und Unterzeile im Zug-Menü
TABS = [
    ('Milestone', 'milestone', 'assets/ma/gardener.png', '{count} reachable'),
    ('Place greenery', 'greenery', 'assets/tiles/greenery.png', None),
    ('Increase the temperature', 'heat', 'assets/global-parameters/temperature.png', None),
    ('Actions', 'actions', 'assets/sidebar/preferences_actions.png', '{count} available'),
    ('Play cards', 'build', 'assets/resources/card.png', '{count} playable'),
    ('Award', 'award', 'assets/ma/landlord.png', '{count} to choose from'),
    ('Standard', 'standard', 'assets/misc/standard_projects.png', '{count} affordable'),
    ('Sell', 'sell', 'assets/misc/1mc.png', '{count} cards in hand'),
]
TONES = {'or-tab--tone-success': 'success', 'or-tab--tone-heat': 'heat', 'or-tab--highlight': 'highlight'}

# Globale Parameter mit ihren Bonus-Stufen (Tharsis, Grundspiel)
PARAMETERS = [
    {'key': 'temperature', 'label': 'Temperature', 'icon': 'assets/global-parameters/temperature.png',
     'min': -30, 'max': 8, 'step': 2, 'unit': ' °C',
     'bonuses': [{'at': -24, 'icon': 'assets/resources/heat.png', 'text': 'Heat production +1'},
                 {'at': -20, 'icon': 'assets/resources/heat.png', 'text': 'Heat production +1'},
                 {'at': 0, 'icon': 'assets/tiles/ocean.png', 'text': 'Place an ocean'}]},
    {'key': 'oxygen', 'label': 'Oxygen', 'icon': 'assets/global-parameters/oxygen.png',
     'min': 0, 'max': 14, 'step': 1, 'unit': ' %',
     'bonuses': [{'at': 8, 'icon': 'assets/global-parameters/temperature.png', 'text': 'Temperature +1 step'}]},
    {'key': 'oceans', 'label': 'Oceans', 'icon': 'assets/tiles/ocean.png',
     'min': 0, 'max': 9, 'step': 1, 'unit': ' / 9', 'bonuses': []},
]


def clean(html: str) -> str:
    """Vue-Reste entfernen, die im statischen Prototyp nur Ballast sind."""
    html = html.replace('<!---->', '')
    html = re.sub(r' style="translate: [^"]*"', '', html)
    return re.sub(r' style="--docked-tab-start: [^"]*"', '', html)


def intro_texts(panel: str) -> list:
    return [re.sub('<[^>]+>', '', text).strip()
            for text in re.findall(r'class="or-tab-intro-(?:title|hint)"[^>]*>(.*?)</div>', panel)]


def parse_tabs() -> list:
    tabs = []
    for tab in FRAGMENTS['tabs']:
        text = tab['text']
        for prefix, key, icon, sub_pattern in TABS:
            if not text.startswith(prefix):
                continue
            match = re.match(r'^(.*?)(\d+)$', text)
            label, count = (match.group(1), match.group(2)) if match else (text, '')
            panel = clean(FRAGMENTS['panels'][text])
            intros = intro_texts(panel)
            sub = sub_pattern.format(count=count) if sub_pattern else (intros[1] if key == 'heat' else intros[0])
            tone = next((value for css, value in TONES.items() if css in tab['cls']), '')
            tabs.append({'key': key, 'label': label.strip(), 'icon': icon, 'sub': sub, 'tone': tone, 'panel': panel})
    return tabs


def placement_tabs() -> list:
    """Platzier-Aufgaben aus Standardprojekten: gleiche Hülle, anderes Plättchen."""
    result = []
    for key, capture, label in (('place-city', PLACE_CITY, 'Place city'), ('place-ocean', PLACE_OCEAN, 'Place ocean')):
        panel = clean(capture['panel'])
        tone = re.search(r'or-tab-panel--tone-(\w+)', panel)
        result.append({'key': key, 'label': label, 'icon': '', 'sub': intro_texts(panel)[0],
                       'tone': tone.group(1) if tone else '', 'panel': panel})
    return result


def tile(tab: dict) -> str:
    tone = f' mb-tile--{tab["tone"]}' if tab['tone'] else ''
    return (f'<button type="button" class="mb-tile{tone}" data-task="{tab["key"]}">'
            f'<img src="{tab["icon"]}" alt=""><span class="mb-tile-text">'
            f'<span class="mb-tile-label">{tab["label"]}</span><span class="mb-tile-sub">{tab["sub"]}</span></span></button>')


def panel(tab: dict) -> str:
    return (f'<div class="mb-panel" data-key="{tab["key"]}" data-title="{tab["label"]}" '
            f'data-sub="{tab["sub"]}" data-tone="{tab["tone"]}">{tab["panel"]}</div>')


def played_cards(slugs: list) -> str:
    # Beide Übersichten liegen im selben Abgriff; Zuordnung über die Kartenklasse card-<slug>
    cards = {}
    for html in PLAYED['played0']['cards'] + PLAYED['played1']['cards']:
        slug = re.search(r'card-container[^"]* card-([a-z0-9-]+)', html).group(1)
        cards.setdefault(slug, clean(html))
    return ''.join(cards[slug] for slug in slugs if slug in cards)


def player(data: dict) -> str:
    cells = []
    for resource, (value, production) in zip(RESOURCES, data['resources']):
        badge = f'<span class="mb-resource-badge">{RESOURCE_BADGES[resource]}</span>' if resource in RESOURCE_BADGES else ''
        cells.append(f'<div class="mb-resource"><i class="resource_icon resource_icon--{resource}"></i>'
                     f'<span class="mb-resource-value" data-value="{data["id"]}.{resource}">{value}</span>'
                     f'<span class="mb-resource-prod" data-value="{data["id"]}.{resource}Production">+{production}</span>{badge}</div>')
    self_class = ' mb-player--self' if data['self'] else ''
    return (f'<div class="mb-player mb-player--{data["color"]}{self_class}">'
            f'<div class="mb-player-head"><span class="mb-player-name">{data["name"]}</span>'
            f'<span class="mb-player-corp">{data["corp"]}</span>'
            f'<span class="mb-player-stats"><span>TR <b data-value="{data["id"]}.tr">{data["tr"]}</b></span>'
            f'<span>Cards <b data-value="{data["id"]}.cards">{data["cards"]}</b></span></span></div>'
            f'<div class="mb-resources">{"".join(cells)}</div>'
            f'<button type="button" class="mb-played-toggle" data-played-toggle>Played cards ({len(data["played"])})</button>'
            f'<div class="mb-played">{played_cards(data["played"])}</div></div>')


def parameter_bar(parameter: dict) -> str:
    steps = (parameter['max'] - parameter['min']) // parameter['step']
    bonuses = ''.join(
        f'<img class="mb-param-bonus" src="{bonus["icon"]}" alt="{bonus["text"]}" title="{bonus["text"]} at {bonus["at"]}{parameter["unit"]}" '
        f'style="left: {(bonus["at"] - parameter["min"]) / (parameter["max"] - parameter["min"]) * 100:.2f}%">'
        for bonus in parameter['bonuses'])
    return (f'<div class="mb-param" data-param="{parameter["key"]}" data-min="{parameter["min"]}" '
            f'data-max="{parameter["max"]}" data-step="{parameter["step"]}" data-unit="{parameter["unit"]}">'
            f'<img class="mb-param-icon" src="{parameter["icon"]}" alt="">'
            f'<span class="mb-param-label">{parameter["label"]}</span>'
            f'<span class="mb-param-value" data-param-value></span>'
            f'<span class="mb-param-track" style="--steps: {steps}"><span class="mb-param-fill" data-param-fill></span>{bonuses}</span>'
            f'<span class="mb-param-range">{parameter["min"]}…{parameter["max"]}</span></div>')


def card_chip(name: str) -> str:
    kind = CARD_KIND.get(REAL_CARD_TYPES.get(name, 'automated'), 'automated')
    return f'<span><span><span class="log-card background-color-{kind}">{name}</span></span></span>'


def real_log_line(entry: dict):
    players = [item['value'] for item in entry['data'] if item['type'] == 2]
    if any(color not in REAL_LOG_PLAYERS for color in players):
        return None
    color = REAL_LOG_PLAYERS[players[0]][1] if players else ''
    def part(item):
        kind, value = item['type'], item['value']
        if kind == 2:
            name, chip = REAL_LOG_PLAYERS[value]
            return f'<span><span class="log-player player_bg_color_{chip}">{name}</span></span>'
        if kind == 3:
            return card_chip(value)
        if kind == 14:
            return ', '.join(card_chip(name) for name in value)
        if kind == 13:
            return f'space {value}'
        return str(value)
    pieces = re.split(r'(\$\{\d\})', entry['message'])
    html = ''.join(part(entry['data'][int(piece[2])]) if re.fullmatch(r'\$\{\d\}', piece)
                   else (f'<span class="log-plain-text">{piece}</span>' if piece else '') for piece in pieces)
    return f'<li class="log-line--{color}">{html}</li>' if color else f'<li>{html}</li>'


def real_history() -> dict:
    history = {}
    for generation in range(1, 6):
        lines = [real_log_line(entry) for entry in load(f'realgame/log-{generation}.json')]
        history[generation] = {'html': ''.join(line for line in lines if line)}
    return history


def game_data() -> dict:
    """Werte, die mobile.js zum Nachstellen der Spiellogik braucht."""
    greenery = re.findall(r'board-space--available" data_space_id="(\d+)"', FRAGMENTS['boardPlace'])
    return {
        'game': GAME,
        'players': {data['id']: dict(zip(RESOURCES, [value for value, _ in data['resources']]),
                                     **{resource + 'Production': production for resource, (_, production) in zip(RESOURCES, data['resources'])},
                                     tr=data['tr'], cards=data['cards']) for data in PLAYERS},
        'available': {'greenery': greenery, 'city': PLACE_CITY['available'], 'ocean': PLACE_OCEAN['available']},
        'setup': SETUP_VALUES,
        'logHistory': real_history(),
    }


def main() -> None:
    tabs = parse_tabs()
    hand_tab = next(tab for tab in FRAGMENTS['tabs'] if tab['text'].startswith('Cards In Hand'))
    self_player = PLAYERS[0]
    values = {
        **{key: str(value) for key, value in GAME.items()},
        'money': str(self_player['resources'][0][0]),
        'moneyProduction': str(self_player['resources'][0][1]),
        'handCount': re.search(r'\d+$', hand_tab['text']).group(0),
        # Die Platzier-Variante enthält die markierten Felder; board.js blendet sie außerhalb des Platzierens aus
        'board': clean(FRAGMENTS['boardPlace']),
        'parameters': ''.join(parameter_bar(parameter) for parameter in PARAMETERS),
        'handPanel': clean(FRAGMENTS['panels'][hand_tab['text']]),
        'milestones': clean(FRAGMENTS['milestones']),
        'log': clean(FRAGMENTS['log']),
        'players': ''.join(player(data) for data in PLAYERS),
        'panels': ''.join(panel(tab) for tab in tabs + placement_tabs()),
        'highlightTiles': ''.join(tile(tab) for tab in tabs if tab['tone']),
        'actionTiles': ''.join(tile(tab) for tab in tabs if not tab['tone']),
        'setup': clean(SETUP['html']),
        'endHero': clean(END['hero']),
        'endPoints': clean(END['points']),
        'endDetails': clean(END['details']),
        'data': json.dumps(game_data(), ensure_ascii=False),
    }
    html = (HERE / 'template.html').read_text()
    html = re.sub(r'\{\{(\w+)\}\}', lambda match: values[match.group(1)], html)

    SITE.mkdir(parents=True, exist_ok=True)
    (SITE / 'app.html').write_text(html)
    shutil.copy(HERE / 'mobile.css', SITE / 'mobile.css')
    shutil.copytree(HERE / 'js', SITE / 'js', dirs_exist_ok=True)
    shutil.copytree(HERE / 'assets-extra', SITE / 'assets-extra', dirs_exist_ok=True)
    # App-Icons und Favicon (erzeugt von icons/make_icons.py) plus Web-App-Manifest
    shutil.copytree(HERE / 'icons' / 'chosen', SITE / 'icons', dirs_exist_ok=True)
    shutil.copy(HERE / 'manifest.webmanifest', SITE / 'manifest.webmanifest')

    # Teilbare Startseite: Handy-Rahmen mit der App darin
    share = (HERE / 'share.html').read_text()
    (SITE / 'index.html').write_text(share)
    # Artifact-Variante der Startseite: Das Hosting legt selbst doctype/head/body herum
    head = re.search(r'<head>(.*)</head>', share, re.S).group(1)
    head = re.sub(r'<meta [^>]*>\s*', '', head)
    body = re.search(r'<body[^>]*>(.*)</body>', share, re.S).group(1)
    (SITE / 'artifact.html').write_text(head.strip() + '\n' + body)
    print('geschrieben:', SITE, '(index.html = Teilen-Seite, app.html = App)')


if __name__ == '__main__':
    main()
