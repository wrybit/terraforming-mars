import {temperatureText, themedAsset} from '@/client/theme/themeDisplay';
import * as c from '@/common/constants';
import {BoardName} from '@/common/boards/BoardName';
import {getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import {getGlobalParameterTracks, GlobalParameterThreshold, GlobalParameterTrackBonus} from '@/common/boards/GlobalParameterTracks';

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

// Bonuses printed on the tracks, per map (same data the server grants them from)
const BONUS_KINDS: Record<GlobalParameterTrackBonus, Pick<BonusSpec, 'kind' | 'title'>> = {
  heatproduction: {kind: 'heat', title: 'Heat'},
  ocean: {kind: 'ocean', title: 'Ocean'},
  temperature: {kind: 'temperature', title: 'Temperature'},
  plant: {kind: 'plant', title: 'Plants'},
  drawcard: {kind: 'card', title: 'Cards'},
  colony: {kind: 'colony', title: 'Colony'},
  tr: {kind: 'tr', title: 'Terraform Rating'},
};

function toBonusSpecs(thresholds: ReadonlyArray<GlobalParameterThreshold>): Array<BonusSpec> {
  return thresholds.map((threshold) => ({at: threshold.value, ...BONUS_KINDS[threshold.bonus]}));
}

function trackBonuses(boardName: BoardName): TrackBonuses {
  const tracks = getGlobalParameterTracks(boardName);
  return {temperature: toBonusSpecs(tracks.temperature), oxygen: toBonusSpecs(tracks.oxygen), venus: toBonusSpecs(tracks.venus)};
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
