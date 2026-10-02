import {EXPANSIONS} from '@/common/cards/GameModule';
import {CARD_RENAMES} from '@/common/cards/CardRenames';
import {PLAYER_COLORS} from '@/common/Color';
import {JSONObject} from '@/common/Types';
import {base64UrlToBytes} from './base64Url';
import {ByteReader} from './ByteReader';
import {codeTableValues, readCodedList, readCodedValue} from './settingsLinkCodes';
import {BOOLEAN_FIELDS, CARD_LIST_FIELDS, ESCAPE_VELOCITY_FIELDS, NUMBER_FIELDS, PLAYER_BEGINNER_FLAG, SETTINGS_LINK_FORMAT_VERSION} from './settingsLinkFields';

/**
 * Unpacks a share link into the same JSON that the file import produces.
 * That way everything goes through the proven JSONProcessor, including checks and warnings.
 */
export function decodeSettingsLink(text: string): JSONObject {
  const reader = new ByteReader(base64UrlToBytes(text));
  const version = reader.readUnsigned();
  if (version !== SETTINGS_LINK_FORMAT_VERSION) {
    throw new Error(`Unsupported settings link version ${version}`);
  }
  const json: JSONObject = {};

  const flags = reader.readFlags();
  BOOLEAN_FIELDS.forEach((field, index) => {
    json[field] = flags[index] ?? false;
  });

  // Turn all known expansions off first, so the link restores exactly its own state
  const expansions: JSONObject = Object.fromEntries(EXPANSIONS.map((expansion) => [expansion, false]));
  const expansionFlags = reader.readFlags();
  codeTableValues('expansions').forEach((expansion, index) => {
    if (expansion in expansions) {
      expansions[expansion] = expansionFlags[index] ?? false;
    }
  });
  json.expansions = expansions;

  json.board = readCodedValue(reader, 'boards');
  json.randomMA = readCodedValue(reader, 'randomMilestones');
  json.politicalAgendasExtension = readCodedValue(reader, 'agendas');
  for (const field of NUMBER_FIELDS) {
    json[field] = reader.readUnsigned();
  }
  if (json.escapeVelocityMode === true) {
    const [thresholdMinutes, bonusSectionsPerAction, penaltyPeriodMinutes, penaltyVPPerPeriod] = ESCAPE_VELOCITY_FIELDS.map(() => reader.readUnsigned());
    json.escapeVelocity = {thresholdMinutes, bonusSectionsPerAction, penaltyPeriodMinutes, penaltyVPPerPeriod};
  }

  const playerCount = reader.readUnsigned();
  const players: Array<JSONObject> = [];
  for (let index = 0; index < playerCount; index++) {
    const color = readCodedValue(reader, 'colors');
    const playerFlags = reader.readUnsigned();
    const handicap = reader.readUnsigned();
    const name = reader.readText();
    players.push({name, color, beginner: (playerFlags & PLAYER_BEGINNER_FLAG) !== 0, handicap, first: false});
  }
  json.players = withDistinctColors(players);

  for (const field of CARD_LIST_FIELDS) {
    // Map renamed cards to their current name, so old links stay valid
    json[field] = readCodedList(reader, 'cards').map((name) => CARD_RENAMES.get(name) ?? name);
  }
  json.customColonies = readCodedList(reader, 'colonies');

  return json;
}

/**
 * The form allows duplicate colors (it only reassigns them on creation), the import rejects them.
 * So such a link still loads, duplicate or unknown colors get a free one.
 */
function withDistinctColors(players: Array<JSONObject>): Array<JSONObject> {
  const used = new Set<string>();
  const free = PLAYER_COLORS.filter((color) => !players.some((player) => player.color === color));
  return players.map((player) => {
    const color = String(player.color);
    const valid = (PLAYER_COLORS as ReadonlyArray<string>).includes(color) && !used.has(color);
    const finalColor = valid ? color : free.shift() ?? color;
    used.add(finalColor);
    return {...player, color: finalColor};
  });
}
