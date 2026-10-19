// Board tabs of the right column: Mars plus one tab per expansion with its own board (only those in this game).
// Each inactive tab shows its tracks as stacked thin lines (BoardTabLines.vue), so you rarely have to switch.
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {PartyName} from '@/common/turmoil/PartyName';
import {MAX_VENUS_SCALE, MIN_TEMPERATURE} from '@/common/constants';
import {getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import {PLANETARY_TRACKS} from '@/common/pathfinders/PlanetaryTracks';
import {PathfindersModel} from '@/common/models/PathfindersModel';
import {Color} from '@/common/Color';
import {arrakisCoordinate} from '@/common/dune/arrakisCoordinates';
import {duneGraphic} from '@/client/components/dune/duneGraphic';

// The Dune expansion gets one tab per module of this game (common/dune/DuneModule.ts), in the order of the concept
// Smuggling and CHOAM have no board tab: they live in their action tabs (SmuggleInput.vue, ChoamInput.vue; Jens 19 Oct 2026)
export const DUNE_BOARD_TABS = ['bazaar', 'worm', 'kanly', 'schemes'] as const;
export type DuneBoardTabId = typeof DUNE_BOARD_TABS[number];
export type BoardTabId = 'mars' | 'moon' | 'colonies' | 'turmoil' | 'paths' | 'delta' | DuneBoardTabId;

// Spice orange: all Dune module tabs share one tone, so they read as one family
const DUNE_TAB_COLOR = '#e0662a';

// Tone = suffix of the or-tab tone classes (or_tab_tones.less); Turmoil shares the teal of the colonies
export const BOARD_TAB_TONE: Record<BoardTabId, string> = {
  mars: 'mars',
  moon: 'moon',
  colonies: 'colonies',
  turmoil: 'colonies',
  paths: 'paths',
  delta: 'delta',
  bazaar: 'bazaar',
  worm: 'bazaar',
  kanly: 'bazaar',
  schemes: 'bazaar',
};

export const BOARD_TAB_LABEL: Record<BoardTabId, string> = {
  mars: 'Mars',
  moon: 'Moon',
  colonies: 'Colonies',
  turmoil: 'Turmoil',
  paths: 'Planets',
  delta: 'Delta',
  bazaar: 'Bazaar',
  worm: 'Shai-Hulud',
  kanly: 'Kanly',
  schemes: 'Schemes',
};

export function boardTabs(game: GameModel): Array<BoardTabId> {
  const tabs: Array<BoardTabId> = ['mars'];
  if (game.moon !== undefined) {
    tabs.push('moon');
  }
  if (game.colonies.length > 0) {
    tabs.push('colonies');
  }
  if (game.turmoil !== undefined) {
    tabs.push('turmoil');
  }
  if (game.gameOptions.expansions.pathfinders && game.pathfinders !== undefined) {
    tabs.push('paths');
  }
  if (game.gameOptions.expansions.deltaProject) {
    tabs.push('delta');
  }
  const dune = game.dune;
  if (dune !== undefined) {
    tabs.push(...DUNE_BOARD_TABS.filter((tab) => dune[tab] !== undefined));
  }
  return tabs;
}

// One line in a tab: a segment per track step, filled up to the current step;
// only the next bonus is marked (glowing dot), bonuses already passed get a subtle dark dot. Delta: player colours at their positions instead of a fill.
export type BoardTabTrack = {
  color: string;
  step: number;
  total: number;
  bonus: ReadonlyArray<number>;
  markers?: ReadonlyArray<{at: number, color: Color}>;
};

// Party colours as on the party tiles (turmoil.less)
const PARTY_COLOR: Record<PartyName, string> = {
  [PartyName.MARS]: '#c0633a',
  [PartyName.SCIENTISTS]: '#5b7bd5',
  [PartyName.UNITY]: '#9aa6b8',
  [PartyName.GREENS]: '#4caf50',
  [PartyName.REDS]: '#d9443a',
  [PartyName.KELVINISTS]: '#e08a2e',
};

function marsTracks(game: GameModel): Array<BoardTabTrack> {
  const max = getGlobalParameterMaximums(game.gameOptions.boardName);
  const temperatureStep = (value: number) => (value - MIN_TEMPERATURE) / 2;
  // Venus moves 2 % per step up to 30 %, above that 1 % per step (Amazonis Planitia goes to 33 %)
  const venusStep = (value: number) => value <= MAX_VENUS_SCALE ? value / 2 : MAX_VENUS_SCALE / 2 + value - MAX_VENUS_SCALE;
  const tracks: Array<BoardTabTrack> = [
    {color: '#e5533d', step: temperatureStep(game.temperature), total: temperatureStep(max.temperature), bonus: [temperatureStep(-24), temperatureStep(-20), temperatureStep(0)]},
    {color: '#5cb85c', step: game.oxygenLevel, total: max.oxygen, bonus: [8]},
    {color: '#3f8ed8', step: game.oceans, total: max.oceans, bonus: []},
  ];
  if (game.gameOptions.expansions.venus) {
    tracks.push({color: '#d9a83a', step: venusStep(game.venusScaleLevel), total: venusStep(max.venus), bonus: [4, 8]});
  }
  return tracks;
}

const PLANET_TRACK_KEYS: ReadonlyArray<keyof PathfindersModel> = ['venus', 'earth', 'mars', 'jovian', 'moon'];

export function boardTabTracks(game: GameModel, players: ReadonlyArray<PublicPlayerModel>, id: BoardTabId): Array<BoardTabTrack> {
  switch (id) {
  case 'mars':
    return marsTracks(game);
  case 'moon': {
    const moon = game.moon;
    if (moon === undefined) {
      return [];
    }
    return [
      {color: '#6fc3df', step: moon.habitatRate, total: 8, bonus: [3, 6]},
      {color: '#c9ccd3', step: moon.logisticRate, total: 8, bonus: [3, 6]},
      {color: '#b88a5a', step: moon.miningRate, total: 8, bonus: [3, 6]},
    ];
  }
  case 'colonies':
    return game.colonies.filter((colony) => colony.isActive)
      .map((colony) => ({color: '#2fb0a8', step: colony.trackPosition + 1, total: 7, bonus: []}));
  case 'turmoil':
    return (game.turmoil?.parties ?? []).filter((party) => party.delegates.length > 0)
      .map((party) => ({color: PARTY_COLOR[party.name], step: party.delegates.reduce((sum, delegate) => sum + delegate.number, 0), total: 6, bonus: []}));
  case 'paths': {
    const pathfinders = game.pathfinders;
    if (pathfinders === undefined) {
      return [];
    }
    // All reward spaces; the lines only show the next one and the ones already passed (BoardTabLines.vue)
    return PLANET_TRACK_KEYS.map((key) => {
      const spaces = PLANETARY_TRACKS[key].spaces;
      const bonus = spaces
        .map((space, index) => ((space.everyone.length + space.risingPlayer.length + space.mostTags.length) > 0 ? index : -1))
        .filter((index) => index > 0);
      return {color: '#d9a83a', step: pathfinders[key], total: spaces.length - 1, bonus};
    });
  }
  case 'delta':
    return [{color: '#f4f5f8', step: 0, total: 12, bonus: [11, 12],
      markers: players.map((player) => ({at: player.deltaProject?.position ?? 0, color: player.color}))}];
  case 'bazaar': {
    // How many of the five slots hold a ware
    const slots = game.dune?.bazaar?.slots ?? [];
    return slots.length === 0 ? [] : [{color: DUNE_TAB_COLOR, step: slots.filter((slot) => slot.ware !== undefined).length, total: slots.length, bonus: []}];
  }
  default:
    // Shai-Hulud, Kanly and schemes have no track worth a line
    return [];
  }
}

// Short info of a Dune module tab beside the lines: a picture, a short text (a coordinate, a number) and small player
// counts in the player colours – so the tab tells what happens in it without opening it
export type BoardTabInfo = {
  icon: string,
  /** Player whose tile it is (Kanly war field): their cube before the text */
  owner?: Color,
  text?: string,
  /** Short text that is translated (e.g. "No battle") */
  label?: string,
  /** Levels reached per own agenda (0 none … 3 hard), shown as points in the level colour */
  levels?: ReadonlyArray<number>,
  counts?: ReadonlyArray<{color: Color, value: number}>,
  /** Tooltip, translation key */
  title: string,
};

export function boardTabInfo(game: GameModel, id: BoardTabId): BoardTabInfo | undefined {
  const dune = game.dune;
  switch (id) {
  case 'worm': {
    const worm = dune?.worm;
    return worm === undefined ? undefined : {icon: duneGraphic('special-worm-domain'), text: arrakisCoordinate(worm.spaceId), title: 'Shai-Hulud lies here'};
  }
  case 'kanly': {
    const kanly = dune?.kanly;
    if (kanly === undefined) {
      return undefined;
    }
    // Whether there is a battle, for which space, whose tile it is and who sends how many (Jens, 19 Oct 2026)
    const battle = kanly.battle;
    if (battle !== undefined) {
      return {icon: duneGraphic('res-sardaukar'), owner: battle.owner, text: arrakisCoordinate(battle.spaceId), title: 'War field',
        counts: battle.troops.map((entry) => ({color: entry.color, value: entry.sardaukar}))};
    }
    return {icon: duneGraphic('res-sardaukar'), label: 'No battle', title: 'No battle'};
  }
  case 'schemes': {
    const schemes = dune?.schemes;
    // The own agendas with the level reached so far: everybody holds agendas, so the others' counts say nothing
    const own = schemes?.players.find((entry) => entry.agendas !== undefined);
    return schemes === undefined ? undefined : {icon: duneGraphic('res-advisor'), title: 'Your agendas',
      levels: own?.agendas?.map((agenda) => agenda.level)};
  }
  default:
    return undefined;
  }
}
