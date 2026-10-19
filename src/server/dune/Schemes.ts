import {IGame} from '../IGame';
import {SCHEMES_TITLE} from '../../common/dune/duneActionTitles';
import {IPlayer} from '../IPlayer';
import {Board} from '../boards/Board';
import {Space} from '../boards/Space';
import {PlayerId} from '../../common/Types';
import {Resource} from '../../common/Resource';
import {Tag} from '../../common/cards/Tag';
import {Phase} from '../../common/Phase';
import {Random} from '../../common/utils/Random';
import {inplaceShuffle} from '../utils/shuffle';
import {isIProjectCard} from '../cards/IProjectCard';
import {OrOptions} from '../inputs/OrOptions';
import {SelectOption} from '../inputs/SelectOption';
import {SelectPlayer} from '../inputs/SelectPlayer';
import {message} from '../logs/MessageBuilder';
import {arrakisRow} from '../../common/dune/arrakisCoordinates';
import {arrakisLayout} from '../../common/dune/arrakisLayout';
import {SCHEME_AGENDAS, SCHEME_REDUCTION_TR, SchemeMeasure, schemeAgenda, schemeLevel, schemePoints} from '../../common/dune/schemeAgendas';
import {SchemeModel} from '../../common/dune/DuneModel';

// Module B – House schemes (claude/dune-erweiterung-konzept.md): every player gets 2 secret agendas. As soon as a player
// reaches 35 TR (checked at the end of the generation), everybody gives one up and keeps the other.
// At game end the highest level reached counts: easy 3, medium 5, hard 8 VP. Before the reduction only the better
// of the two agendas scores.

export type SchemesData = {
  agendas: Record<PlayerId, Array<string>>,
  /** Everybody has given up one agenda */
  reduced: boolean,
  /** Players still to choose which agenda to keep; set while the game waits (reload resumes) */
  choosers: Array<PlayerId>,
  /** Agendas nobody holds (Mentat Calculation looks at the top 3) */
  deck: Array<string>,
};

export {SCHEMES_TITLE};

export function initializeSchemes(players: ReadonlyArray<IPlayer>, rng: Random): SchemesData {
  const deck = SCHEME_AGENDAS.map((agenda) => agenda.name);
  inplaceShuffle(deck, rng);
  const agendas: Record<PlayerId, Array<string>> = {};
  for (const player of players) {
    agendas[player.id] = deck.splice(0, 2);
  }
  return {agendas, reduced: false, choosers: [], deck};
}

function ownTiles(player: IPlayer): Array<Space> {
  return player.game.board.spaces.filter((space) => space.player?.id === player.id && Board.hasRealTile(space));
}

function isSpecialTile(space: Space): boolean {
  return Board.hasRealTile(space) && !Board.isCitySpace(space) && !Board.isGreenerySpace(space) && !Board.isOceanSpace(space);
}

function largestGroup(player: IPlayer): number {
  const own = new Set(ownTiles(player).map((space) => space.id));
  const seen = new Set<string>();
  let largest = 0;
  for (const start of own) {
    if (seen.has(start)) {
      continue;
    }
    let size = 0;
    const queue = [player.game.board.getSpaceOrThrow(start)];
    seen.add(start);
    while (queue.length > 0) {
      const space = queue.pop() as Space;
      size++;
      for (const next of player.game.board.getAdjacentSpaces(space)) {
        if (own.has(next.id) && !seen.has(next.id)) {
          seen.add(next.id);
          queue.push(next);
        }
      }
    }
    largest = Math.max(largest, size);
  }
  return largest;
}

/** The value an agenda counts for `player` right now */
export function schemeValue(player: IPlayer, measure: SchemeMeasure): number {
  const board = player.game.board;
  const tags = (tag: Tag) => player.tags.count(tag, 'raw');
  switch (measure) {
  case 'tilesNextToOceans':
    return ownTiles(player).filter((space) => board.getAdjacentSpaces(space).some((adjacent) => Board.isOceanSpace(adjacent))).length;
  case 'greeneries':
    return ownTiles(player).filter((space) => Board.isGreenerySpace(space)).length;
  case 'cities':
    return ownTiles(player).filter((space) => Board.isCitySpace(space)).length;
  case 'largestTileGroup':
    return largestGroup(player);
  case 'specialTilesWithOwnNeighbour':
    return board.spaces.filter((space) => isSpecialTile(space) &&
      board.getAdjacentSpaces(space).some((adjacent) => adjacent.player?.id === player.id && Board.hasRealTile(adjacent))).length;
  case 'rowsWithOwnTile':
    return new Set(ownTiles(player).map((space) => arrakisRow(arrakisLayout(player.game.gameOptions.boardName), space.id)).filter((row) => row !== undefined)).size;
  case 'titaniumProduction':
    return player.production.get(Resource.TITANIUM);
  case 'steelProduction':
    return player.production.get(Resource.STEEL);
  case 'steelAndTitaniumProduction':
    return player.production.get(Resource.STEEL) + player.production.get(Resource.TITANIUM);
  case 'plantProduction':
    return player.production.get(Resource.PLANTS);
  case 'energyProduction':
    return player.production.get(Resource.ENERGY);
  case 'heatProduction':
    return player.production.get(Resource.HEAT);
  case 'megacreditProduction':
    return player.production.get(Resource.MEGACREDITS);
  case 'terraformRating':
    return player.terraformRating;
  case 'spaceTags':
    return tags(Tag.SPACE);
  case 'scienceTags':
    return tags(Tag.SCIENCE);
  case 'buildingTags':
    return tags(Tag.BUILDING);
  case 'earthTags':
    return tags(Tag.EARTH);
  case 'jovianTags':
    return tags(Tag.JOVIAN);
  case 'powerTags':
    return tags(Tag.POWER);
  case 'microbeAndAnimalTags':
    return tags(Tag.MICROBE) + tags(Tag.ANIMAL);
  case 'tagKindsWithThree':
    return [Tag.BUILDING, Tag.SPACE, Tag.SCIENCE, Tag.POWER, Tag.EARTH, Tag.JOVIAN, Tag.PLANT, Tag.MICROBE, Tag.ANIMAL, Tag.CITY]
      .filter((tag) => tags(tag) >= 3).length;
  case 'events':
    return player.getPlayedEventsCount();
  case 'projectCards':
    return player.playedCards.asArray().filter((card) => isIProjectCard(card)).length;
  }
}

export function agendaPoints(player: IPlayer, name: string): number {
  const agenda = schemeAgenda(name);
  return schemePoints(schemeLevel(agenda, schemeValue(player, agenda.measure)));
}

/** VP of a player: the best agenda still held */
export function schemesVictoryPoints(player: IPlayer, data: SchemesData): number {
  return Math.max(0, ...(data.agendas[player.id] ?? []).map((name) => agendaPoints(player, name)));
}

/** End of generation: once a player has reached 35 TR, everybody chooses the agenda to keep. `next` when done. */
export function reductionStep(game: IGame, data: SchemesData, next: () => void): void {
  if (data.reduced) {
    next();
    return;
  }
  if (data.choosers.length === 0) {
    if (!game.players.some((player) => player.terraformRating >= SCHEME_REDUCTION_TR)) {
      next();
      return;
    }
    game.log('A House reached ${0} TR: everybody gives up one agenda', (b) => b.number(SCHEME_REDUCTION_TR));
    data.choosers = game.playersInGenerationOrder.filter((player) => (data.agendas[player.id] ?? []).length > 1).map((player) => player.id);
  }
  askNext(game, data, next);
}

function askNext(game: IGame, data: SchemesData, next: () => void): void {
  const chooserId = data.choosers[0];
  if (chooserId === undefined) {
    data.reduced = true;
    next();
    return;
  }
  const chooser = game.getPlayerById(chooserId);
  game.save();
  chooser.setWaitingFor(keepInput(chooser, data), () => {
    data.choosers.shift();
    askNext(game, data, next);
  });
}

export function keepInput(player: IPlayer, data: SchemesData): OrOptions {
  const agendas = data.agendas[player.id] ?? [];
  return new OrOptions(...agendas.map((name) => new SelectOption(message('Keep ${0}', (b) => b.string(name)), 'Keep').andThen(() => {
    data.agendas[player.id] = [name];
    player.game.log('${0} gave up one agenda', (b) => b.player(player));
    return undefined;
  }))).setTitle(SCHEMES_TITLE);
}

/** Mentat Calculation card: swap one own agenda for one of the top 3 of the deck, or keep them */
export function mentatInput(player: IPlayer): OrOptions | undefined {
  const data = player.game.duneData?.schemes;
  if (data === undefined) {
    return undefined;
  }
  const own = data.agendas[player.id] ?? [];
  const top = data.deck.slice(0, 3);
  const options: Array<SelectOption> = [];
  for (const mine of own) {
    for (const other of top) {
      options.push(new SelectOption(message('Swap ${0} for ${1}', (b) => b.string(mine).string(other)), 'Swap').andThen(() => {
        data.agendas[player.id] = own.map((name) => (name === mine ? other : name));
        data.deck.splice(data.deck.indexOf(other), 1);
        data.deck.push(mine);
        player.game.log('${0} swapped an agenda', (b) => b.player(player));
        return undefined;
      }));
    }
  }
  options.push(new SelectOption('Keep my agendas', 'Keep'));
  return new OrOptions(...options).setTitle('Mentat Calculation: swap an agenda?');
}

/** Tleilaxu Spy card: the agendas of another player, shown only to the spy (private log line) */
export function spyInput(player: IPlayer): SelectPlayer | undefined {
  const data = player.game.duneData?.schemes;
  const others = player.game.players.filter((other) => other !== player);
  if (data === undefined || others.length === 0) {
    return undefined;
  }
  return new SelectPlayer(others, 'Tleilaxu Spy: whose agendas do you look at?', 'Look').andThen((target) => {
    for (const name of data.agendas[target.id] ?? []) {
      player.game.log('${0} holds the agenda ${1}', (b) => b.player(target).string(name), {reservedFor: player});
    }
    return undefined;
  });
}

/** The own agendas are secret: others only see how many a player holds, until the game ends */
export function schemesModel(game: IGame, data: SchemesData, viewer: IPlayer | undefined): SchemeModel {
  const revealed = game.phase === Phase.END;
  return {
    reduced: data.reduced,
    players: game.players.map((player) => {
      const names = data.agendas[player.id] ?? [];
      const visible = revealed || viewer?.id === player.id;
      return {
        color: player.color,
        count: names.length,
        agendas: visible ? names.map((name) => {
          const agenda = schemeAgenda(name);
          const value = schemeValue(player, agenda.measure);
          return {name, value, level: schemeLevel(agenda, value)};
        }) : undefined,
      };
    }),
  };
}
