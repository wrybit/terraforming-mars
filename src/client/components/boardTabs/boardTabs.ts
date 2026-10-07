// Board tabs of the right column: Mars plus one tab per expansion with its own board (only those in this game).
// Each inactive tab shows its tracks as stacked thin lines (BoardTabLines.vue), so you rarely have to switch.
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {PartyName} from '@/common/turmoil/PartyName';
import {MAX_OCEAN_TILES, MAX_OXYGEN_LEVEL, MAX_TEMPERATURE, MAX_VENUS_SCALE, MIN_TEMPERATURE} from '@/common/constants';
import {PLANETARY_TRACKS} from '@/common/pathfinders/PlanetaryTracks';
import {PathfindersModel} from '@/common/models/PathfindersModel';
import {Color} from '@/common/Color';

export type BoardTabId = 'mars' | 'moon' | 'colonies' | 'turmoil' | 'paths' | 'delta';

// Tone = suffix of the or-tab tone classes (or_tab_tones.less); Turmoil shares the teal of the colonies
export const BOARD_TAB_TONE: Record<BoardTabId, string> = {
  mars: 'mars',
  moon: 'moon',
  colonies: 'colonies',
  turmoil: 'colonies',
  paths: 'paths',
  delta: 'delta',
};

export const BOARD_TAB_LABEL: Record<BoardTabId, string> = {
  mars: 'Mars',
  moon: 'Moon',
  colonies: 'Colonies',
  turmoil: 'Turmoil',
  paths: 'Planets',
  delta: 'Delta',
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
  const temperatureStep = (value: number) => (value - MIN_TEMPERATURE) / 2;
  const tracks: Array<BoardTabTrack> = [
    {color: '#e5533d', step: temperatureStep(game.temperature), total: temperatureStep(MAX_TEMPERATURE), bonus: [temperatureStep(-24), temperatureStep(-20), temperatureStep(0)]},
    {color: '#5cb85c', step: game.oxygenLevel, total: MAX_OXYGEN_LEVEL, bonus: [8]},
    {color: '#3f8ed8', step: game.oceans, total: MAX_OCEAN_TILES, bonus: []},
  ];
  if (game.gameOptions.expansions.venus) {
    tracks.push({color: '#d9a83a', step: game.venusScaleLevel / 2, total: MAX_VENUS_SCALE / 2, bonus: [4, 8]});
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
  }
}
