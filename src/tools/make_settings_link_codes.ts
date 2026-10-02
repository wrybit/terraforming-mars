// Adds new values to src/client/components/create/settingsLink/settingsLinkCodes.json.
//
// The file is the contract table for share links: position in the list = code in the link.
// So entries are only appended, never reordered or deleted – otherwise old
// bookmarks point to other cards/boards. Run after every upstream merge: npm run make:linkcodes
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

// Current values per table; the order only matters on the very first creation
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
    console.error(`${added} values missing in settingsLinkCodes.json – run npm run make:linkcodes`);
    process.exit(1);
  }
} else {
  // One entry per line, so additions are clearly visible in the diff
  const lines = Object.entries(existing).map(([table, entries]) =>
    `  ${JSON.stringify(table)}: [\n${entries.map((entry) => `    ${JSON.stringify(entry)}`).join(',\n')}\n  ]`);
  fs.writeFileSync(CODES_FILE, `{\n${lines.join(',\n')}\n}\n`);
  console.log(`settingsLinkCodes.json: ${added} neue Werte`);
}
