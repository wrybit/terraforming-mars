import {temperatureText, themedAsset} from '@/client/theme/themeDisplay';
import * as c from '@/common/constants';
import {BoardName} from '@/common/boards/BoardName';
import {getGlobalParameterMaximums, hasAmazonisTracks} from '@/common/boards/GlobalParameterMaximums';

/* Bonus threshold on a parameter bar. */
export type ParameterBonus = {
  at: number;
  percent: number;
  kind: 'heat' | 'ocean' | 'temperature' | 'plant' | 'card' | 'colony' | 'tr';
  title: string;
};

/* A global parameter as the mobile view shows it as a bar. */
export type ParameterBar = {
  key: 'temperature' | 'oxygen' | 'oceans' | 'venus';
  label: string;
  icon: string;
  min: number;
  max: number;
  value: number;
  percent: number;
  text: string;
  done: boolean;
  // Number of steps up to the maximum (bar segments like the fields of the scale on the board)
  steps: number;
  bonuses: ReadonlyArray<ParameterBonus>;
};

// boardName: the map decides the maximums (Amazonis Planitia raises them); without it the standard maximums apply
type Levels = {temperature: number, oxygen: number, oceans: number, venus: number | undefined, boardName?: BoardName};

type BarSpec = Omit<ParameterBar, 'percent' | 'done' | 'bonuses' | 'steps'> & {
  step: number;
  // Number of steps if the step size is not uniform (Venus above 30 % counts 1 % per step)
  steps?: number;
  bonuses: ReadonlyArray<Omit<ParameterBonus, 'percent'>>;
};

type BonusSpec = Omit<ParameterBonus, 'percent'>;
type TrackBonuses = {temperature: ReadonlyArray<BonusSpec>, oxygen: ReadonlyArray<BonusSpec>, venus: ReadonlyArray<BonusSpec>};

// Bonuses printed on the tracks, per map (mirrors src/server/boards/GlobalParameterTracks.ts)
const HEAT_1: BonusSpec = {at: c.TEMPERATURE_BONUS_FOR_HEAT_1, kind: 'heat', title: 'Heat'};
const HEAT_2: BonusSpec = {at: c.TEMPERATURE_BONUS_FOR_HEAT_2, kind: 'heat', title: 'Heat'};
const OCEAN: BonusSpec = {at: c.TEMPERATURE_FOR_OCEAN_BONUS, kind: 'ocean', title: 'Ocean'};
const VENUS_CARD: BonusSpec = {at: c.VENUS_LEVEL_FOR_CARD_BONUS, kind: 'card', title: 'Cards'};

const STANDARD_BONUSES: TrackBonuses = {
  temperature: [HEAT_1, HEAT_2, OCEAN],
  oxygen: [{at: c.OXYGEN_LEVEL_FOR_TEMPERATURE_BONUS, kind: 'temperature', title: 'Temperature'}],
  venus: [VENUS_CARD, {at: c.VENUS_LEVEL_FOR_TR_BONUS, kind: 'tr', title: 'Terraform Rating'}],
};

const AMAZONIS_BONUSES: TrackBonuses = {
  temperature: [HEAT_1, HEAT_2, {at: c.TEMPERATURE_BONUS_FOR_PLANT, kind: 'plant', title: 'Plants'}, OCEAN],
  oxygen: [
    {at: c.OXYGEN_LEVEL_FOR_AMAZONIS_CARD_BONUS, kind: 'card', title: 'Cards'},
    {at: c.OXYGEN_LEVEL_FOR_AMAZONIS_TEMPERATURE_BONUS, kind: 'temperature', title: 'Temperature'},
  ],
  venus: [
    VENUS_CARD,
    {at: c.VENUS_LEVEL_FOR_AMAZONIS_COLONY_BONUS, kind: 'colony', title: 'Colony'},
    {at: c.VENUS_LEVEL_FOR_AMAZONIS_TR_BONUS, kind: 'tr', title: 'Terraform Rating'},
  ],
};

function trackBonuses(boardName: BoardName): TrackBonuses {
  return hasAmazonisTracks(boardName) ? AMAZONIS_BONUSES : STANDARD_BONUSES;
}

function toPercent(value: number, min: number, max: number): number {
  return Math.round((value - min) / (max - min) * 1000) / 10;
}

function build(spec: BarSpec): ParameterBar {
  return {
    ...spec,
    percent: toPercent(spec.value, spec.min, spec.max),
    done: spec.value >= spec.max,
    steps: spec.steps ?? Math.round((spec.max - spec.min) / spec.step),
    bonuses: spec.bonuses.map((bonus) => ({...bonus, percent: toPercent(bonus.at, spec.min, spec.max)})),
  };
}

/* Bars for temperature, oxygen, oceans and (with Venus) the Venus scale, in board order. */
export function parameterBars(levels: Levels): Array<ParameterBar> {
  const boardName = levels.boardName ?? BoardName.THARSIS;
  const max = getGlobalParameterMaximums(boardName);
  const bonuses = trackBonuses(boardName);
  const specs: Array<BarSpec> = [
    {
      key: 'temperature', label: 'Temperature', icon: themedAsset('assets/global-parameters/temperature.png'),
      min: c.MIN_TEMPERATURE, max: max.temperature, step: 2, value: levels.temperature, text: temperatureText(levels.temperature),
      bonuses: bonuses.temperature,
    },
    {
      key: 'oxygen', label: 'Oxygen', icon: themedAsset('assets/global-parameters/oxygen.png'),
      min: c.MIN_OXYGEN_LEVEL, max: max.oxygen, step: 1, value: levels.oxygen, text: levels.oxygen + ' %',
      bonuses: bonuses.oxygen,
    },
    {
      key: 'oceans', label: 'Oceans', icon: themedAsset('assets/tiles/ocean.png'),
      min: 0, max: max.oceans, step: 1, value: levels.oceans, text: levels.oceans + '/' + max.oceans,
      bonuses: [],
    },
  ];
  if (levels.venus !== undefined) {
    specs.push({
      key: 'venus', label: 'Venus', icon: 'assets/global-parameters/venus.png',
      min: c.MIN_VENUS_SCALE, max: max.venus, step: 2, value: levels.venus,
      steps: (c.MAX_VENUS_SCALE - c.MIN_VENUS_SCALE) / 2 + Math.max(max.venus - c.MAX_VENUS_SCALE, 0), text: levels.venus + ' %',
      bonuses: bonuses.venus,
    });
  }
  return specs.map(build);
}
