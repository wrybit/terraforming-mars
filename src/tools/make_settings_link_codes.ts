// Ergänzt src/client/components/create/settingsLink/settingsLinkCodes.json um neue Werte.
//
// Die Datei ist die Vertragstabelle für Teilen-Links: Position in der Liste = Code im Link.
// Deshalb wird nur hinten angehängt, nie umsortiert oder gelöscht – sonst zeigen alte
// Lesezeichen auf andere Karten/Pläne. Aufruf nach jedem Upstream-Merge: npm run make:linkcodes
import fs from 'fs';
import path from 'path';
import {BoardName} from '../common/boards/BoardName';
import {RandomBoardOption} from '../common/boards/RandomBoardOption';
import {CardName} from '../common/cards/CardName';
import {EXPANSIONS} from '../common/cards/GameModule';
import {ColonyName} from '../common/colonies/ColonyName';
import {PLAYER_COLORS} from '../common/Color';
import {RandomMAOptionType} from '../common/ma/RandomMAOptionType';
import {AgendaStyle} from '../common/turmoil/Types';

const AGENDA_STYLES: ReadonlyArray<AgendaStyle> = ['Standard', 'Random', 'Chairman'];

const CODES_FILE = path.resolve('src/client/components/create/settingsLink/settingsLinkCodes.json');

// Aktuelle Werte je Tabelle; die Reihenfolge zählt nur beim allerersten Anlegen
const currentValues: Record<string, ReadonlyArray<string>> = {
  boards: [...Object.values(BoardName), ...Object.values(RandomBoardOption)],
  expansions: EXPANSIONS,
  colors: PLAYER_COLORS,
  randomMilestones: Object.values(RandomMAOptionType),
  agendas: AGENDA_STYLES,
  cards: Object.values(CardName),
  colonies: Object.values(ColonyName),
};

const existing: Record<string, Array<string>> = fs.existsSync(CODES_FILE) ? JSON.parse(fs.readFileSync(CODES_FILE, 'utf8')) : {};
const checkOnly = process.argv.includes('--check');
let added = 0;

for (const [table, values] of Object.entries(currentValues)) {
  const entries = existing[table] ?? [];
  const known = new Set(entries);
  for (const value of values) {
    if (!known.has(value)) {
      entries.push(value);
      known.add(value);
      added++;
      console.log(`${table}: + ${value}`);
    }
  }
  existing[table] = entries;
}

if (checkOnly) {
  if (added > 0) {
    console.error(`${added} Werte fehlen in settingsLinkCodes.json – npm run make:linkcodes ausführen`);
    process.exit(1);
  }
} else {
  // Ein Eintrag je Zeile, damit Ergänzungen im Diff klar sichtbar sind
  const lines = Object.entries(existing).map(([table, entries]) =>
    `  ${JSON.stringify(table)}: [\n${entries.map((entry) => `    ${JSON.stringify(entry)}`).join(',\n')}\n  ]`);
  fs.writeFileSync(CODES_FILE, `{\n${lines.join(',\n')}\n}\n`);
  console.log(`settingsLinkCodes.json: ${added} neue Werte`);
}
