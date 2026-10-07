import {CreateGameModel} from '../CreateGameModel';
import {bytesToBase64Url} from './base64Url';
import {ByteWriter} from './ByteWriter';
import {codeTableValues, writeCodedList, writeCodedValue} from './settingsLinkCodes';
import {BOOLEAN_FIELDS, CARD_LIST_FIELDS, ESCAPE_VELOCITY_FIELDS, NUMBER_FIELDS, PLAYER_AI_LEVEL_SHIFT, PLAYER_BEGINNER_FLAG, SETTINGS_LINK_FORMAT_VERSION} from './settingsLinkFields';
import {AI_LEVELS} from '@/common/ai/AiLevel';

/**
 * Packs the form settings into a short URL-safe string.
 *
 * Seed and clone game deliberately stay out: every link should create a new game.
 */
export function encodeSettingsLink(model: CreateGameModel): string {
  const writer = new ByteWriter();
  writer.writeUnsigned(SETTINGS_LINK_FORMAT_VERSION);

  writer.writeFlags(BOOLEAN_FIELDS.map((field) => model[field] === true));
  writer.writeFlags(codeTableValues('expansions').map((expansion) => model.expansions[expansion as keyof typeof model.expansions] === true));

  writeCodedValue(writer, 'boards', model.board);
  writeCodedValue(writer, 'randomMilestones', model.randomMA);
  writeCodedValue(writer, 'agendas', model.politicalAgendasExtension);
  for (const field of NUMBER_FIELDS) {
    writer.writeUnsigned(model[field]);
  }
  if (model.escapeVelocityMode) {
    for (const field of ESCAPE_VELOCITY_FIELDS) {
      writer.writeUnsigned(model[field]);
    }
  }

  const players = model.players.slice(0, model.playersCount);
  writer.writeUnsigned(players.length);
  for (const player of players) {
    writeCodedValue(writer, 'colors', player.color);
    const aiBits = player.aiLevel === undefined ? 0 : (AI_LEVELS.indexOf(player.aiLevel) + 1) << PLAYER_AI_LEVEL_SHIFT;
    writer.writeUnsigned((player.beginner ? PLAYER_BEGINNER_FLAG : 0) | aiBits);
    writer.writeUnsigned(player.handicap);
    writer.writeText(player.name);
  }

  for (const field of CARD_LIST_FIELDS) {
    writeCodedList(writer, 'cards', model[field]);
  }
  writeCodedList(writer, 'colonies', model.customColonies);

  return bytesToBase64Url(writer.toBytes());
}
