import {CardName} from '../cards/CardName';
import {Color} from '../Color';
import {LogMessageData} from '../logs/LogMessageData';
import {LogMessageType} from '../logs/LogMessageType';
import {SpaceId} from '../Types';
import {TileType} from '../TileType';

// What a replay is reconstructed from (api/replay): the start and the end of a finished game plus its whole log.
// Players are named by colour only: player ids would let anyone take over a seat, so they never leave the server.

export type ReplayResources = {
  megacredits: number,
  steel: number,
  titanium: number,
  plants: number,
  energy: number,
  heat: number,
};

export type ReplaySourcePlayer = {
  color: Color,
  name: string,
  // Start of the game (save 0)
  startTerraformRating: number,
  dealtProjectCards: ReadonlyArray<CardName>,
  // End of the game
  endResources: ReplayResources,
  endHand: ReadonlyArray<CardName>,
};

export type ReplaySourceTile = {
  space: SpaceId,
  tileType: TileType,
  // Card that placed the tile (e.g. Phobos Space Haven): tiles outside Mars have no log line of their own
  card?: CardName,
};

export type ReplaySourceMessage = {
  message: string,
  data: ReadonlyArray<LogMessageData>,
  type?: LogMessageType,
  // Private line: only this player saw it in the game (e.g. which cards they bought)
  viewer?: Color,
};

export type ReplaySourceModel = {
  // Players in the order of the game
  players: ReadonlyArray<ReplaySourcePlayer>,
  startTemperature: number,
  startOxygenLevel: number,
  endTiles: ReadonlyArray<ReplaySourceTile>,
  log: ReadonlyArray<ReplaySourceMessage>,
  // Standard projects of this game (with its expansions), for the action tabs of the replay
  standardProjects?: ReadonlyArray<CardName>,
};
