import {CardName} from '@/common/cards/CardName';
import {CardType} from '@/common/cards/CardType';
import {Tag} from '@/common/cards/Tag';
import {Color} from '@/common/Color';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {GameModel} from '@/common/models/GameModel';
import {PlayerViewModel, PublicPlayerModel, ViewModel} from '@/common/models/PlayerModel';
import {ReplaySourceModel} from '@/common/models/ReplaySourceModel';
import {Phase} from '@/common/Phase';
import {TileType} from '@/common/TileType';
import {MilestoneName} from '@/common/ma/MilestoneName';
import {AwardName} from '@/common/ma/AwardName';
import {getCard} from '@/client/cards/ClientCardManifest';
import {GenerationLog} from '@/client/utils/fetchLogs';
import {ReplayPlayerState, ReplayState} from './reconstructReplay';
import {overlayGame, overlayPlayer, replayTrackView} from './replayTrackOverlay';

// Turns a reconstructed state into the models of the normal game view (PlayersOverview, Mars, log, hand cards),
// so the replay shows the game exactly as it looked. Starts from the final view of the results page and replaces
// everything that changes during a game.

const CITY_TILES = new Set<TileType>([TileType.CITY, TileType.CAPITAL]);

function tagsOf(played: ReadonlyArray<CardName>, template: Record<Tag, number>): Record<Tag, number> {
  const tags = Object.fromEntries(Object.keys(template).map((tag) => [tag, 0])) as Record<Tag, number>;
  for (const name of played) {
    const card = getCard(name);
    if (card === undefined) {
      continue;
    }
    // Played events only count with their event tag
    const counted = card.type === CardType.EVENT ? [Tag.EVENT] : card.tags;
    counted.forEach((tag) => tags[tag] = (tags[tag] ?? 0) + 1);
  }
  return tags;
}

function playerModel(final: PublicPlayerModel, state: ReplayState, player: ReplayPlayerState, generation: number, last: boolean): PublicPlayerModel {
  const [megacredits, steel, titanium, plants, energy, heat] = player.resources;
  const [megacreditProduction, steelProduction, titaniumProduction, plantProduction, energyProduction, heatProduction] = player.production;
  // Points as recorded at the end of each generation: during a generation the last finished one
  const points = last ? final.victoryPointsBreakdown.total : (final.victoryPointsByGeneration[generation - 2] ?? 0);
  return {
    ...final,
    megacredits, steel, titanium, plants, energy, heat,
    megacreditProduction, steelProduction, titaniumProduction, plantProduction, energyProduction, heatProduction,
    terraformRating: player.terraformRating,
    cardsInHandNbr: player.hand.length + player.unknownHand,
    tableau: player.played.map((name) => ({name, resources: player.cardResources[name]})),
    actionsThisGeneration: player.actionsThisGeneration,
    tags: tagsOf(player.played, final.tags),
    citiesCount: state.tiles.filter((tile) => tile.color === final.color && CITY_TILES.has(tile.tileType)).length,
    isActive: state.active === final.color,
    victoryPointsBreakdown: {...final.victoryPointsBreakdown, total: points},
    victoryPointsByGeneration: final.victoryPointsByGeneration.slice(0, Math.max(0, generation - 1)),
    needsToDraft: false,
    needsToResearch: false,
  };
}

function gameModel(final: GameModel, state: ReplayState, source: ReplaySourceModel, last: boolean): GameModel {
  const tiles = new Map(state.tiles.map((tile) => [tile.space, tile]));
  const nameOf = (color: Color | undefined) => source.players.find((player) => player.color === color)?.name;
  return {
    ...final,
    // No clocks: they would show the final playing time at every step and, running live, update the view every second
    gameOptions: {...final.gameOptions, showTimers: false},
    generation: state.generation,
    temperature: state.temperature,
    oxygenLevel: state.oxygenLevel,
    oceans: state.oceans,
    phase: last ? Phase.END : Phase.ACTION,
    // The log shows the "Mars is terraformed" banner for it: only at the very end
    isTerraformed: last && final.isTerraformed,
    passedPlayers: state.passed,
    spaces: final.spaces.map((space) => {
      const tile = tiles.get(space.id);
      const {tileType: _tileType, color: _color, ...empty} = space;
      return tile === undefined ? empty : {...empty, tileType: tile.tileType, ...(tile.color !== undefined ? {color: tile.color} : {})};
    }),
    milestones: final.milestones.map((milestone) => {
      const claimed = state.milestones.find((entry) => entry.name === milestone.name as MilestoneName);
      return {...milestone, playerName: nameOf(claimed?.color), color: claimed?.color};
    }),
    awards: final.awards.map((award) => {
      const funded = state.awards.find((entry) => entry.name === award.name as AwardName);
      return {...award, playerName: nameOf(funded?.color), color: funded?.color};
    }),
  };
}

/** The view of one moment of the replay, seen by the chosen player (their hand cards, their private log lines). */
export function replayViewModel(final: ViewModel, source: ReplaySourceModel, state: ReplayState, perspective: Color, last: boolean, line: number): PlayerViewModel {
  const track = replayTrackView(source, line);
  const players = final.players.map((finalPlayer) => {
    const index = source.players.findIndex((player) => player.color === finalPlayer.color);
    return overlayPlayer(index < 0 ? finalPlayer : playerModel(finalPlayer, state, state.players[index], state.generation, last), track);
  });
  const thisPlayer = players.find((player) => player.color === perspective) ?? players[0];
  const own = state.players[source.players.findIndex((player) => player.color === thisPlayer.color)];
  return {
    ...final,
    game: overlayGame(gameModel(final.game, state, source, last), track),
    players,
    color: thisPlayer.color,
    thisPlayer,
    autopass: false,
    cardsInHand: (own?.hand ?? []).map((name) => ({name})),
    ceoCardsInHand: [],
    dealtCorporationCards: [],
    dealtPreludeCards: [],
    dealtProjectCards: [],
    dealtCeoCards: [],
    draftedCards: [],
    id: thisPlayer.id ?? final.id,
    pickedCorporationCard: [],
    preludeCardsInHand: [],
    requestId: undefined,
    waitingFor: undefined,
  } as PlayerViewModel;
}

/** Log up to a state as the log panel shows it: grouped by generation, private lines only for the chosen player. */
export function replayLogStream(source: ReplaySourceModel, lastLine: number, perspective: Color): Array<GenerationLog> {
  const stream: Array<GenerationLog> = [{generation: 1, messages: []}];
  source.log.slice(0, lastLine + 1).forEach((entry) => {
    if (entry.viewer !== undefined && entry.viewer !== perspective) {
      return;
    }
    const message = new LogMessage(entry.type ?? LogMessageType.DEFAULT, entry.message, [...entry.data]);
    if (entry.type === LogMessageType.NEW_GENERATION) {
      const generation = Number(entry.data[0]?.value);
      if (generation > 1) {
        stream.push({generation, messages: []});
      }
    }
    stream[stream.length - 1].messages.push(message);
  });
  return stream;
}
