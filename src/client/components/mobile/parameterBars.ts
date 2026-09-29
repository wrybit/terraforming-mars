import * as c from '@/common/constants';

/* Bonus-Schwelle auf einem Parameter-Balken. */
export type ParameterBonus = {
  at: number;
  percent: number;
  kind: 'heat' | 'ocean' | 'temperature' | 'card' | 'tr';
  title: string;
};

/* Ein globaler Parameter, wie ihn die Mobil-Ansicht als Balken zeigt. */
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
  bonuses: ReadonlyArray<ParameterBonus>;
};

type Levels = {temperature: number, oxygen: number, oceans: number, venus: number | undefined};

type BarSpec = Omit<ParameterBar, 'percent' | 'done' | 'bonuses'> & {
  bonuses: ReadonlyArray<Omit<ParameterBonus, 'percent'>>;
};

function toPercent(value: number, min: number, max: number): number {
  return Math.round((value - min) / (max - min) * 1000) / 10;
}

function build(spec: BarSpec): ParameterBar {
  return {
    ...spec,
    percent: toPercent(spec.value, spec.min, spec.max),
    done: spec.value >= spec.max,
    bonuses: spec.bonuses.map((bonus) => ({...bonus, percent: toPercent(bonus.at, spec.min, spec.max)})),
  };
}

/* Balken für Temperatur, Sauerstoff, Ozeane und (mit Venus) die Venus-Skala in Brett-Reihenfolge. */
export function parameterBars(levels: Levels): Array<ParameterBar> {
  const specs: Array<BarSpec> = [
    {
      key: 'temperature', label: 'Temperature', icon: 'assets/global-parameters/temperature.png',
      min: c.MIN_TEMPERATURE, max: c.MAX_TEMPERATURE, value: levels.temperature, text: levels.temperature + ' °C',
      bonuses: [
        {at: c.TEMPERATURE_BONUS_FOR_HEAT_1, kind: 'heat', title: 'Heat production'},
        {at: c.TEMPERATURE_BONUS_FOR_HEAT_2, kind: 'heat', title: 'Heat production'},
        {at: c.TEMPERATURE_FOR_OCEAN_BONUS, kind: 'ocean', title: 'Ocean'},
      ],
    },
    {
      key: 'oxygen', label: 'Oxygen', icon: 'assets/global-parameters/oxygen.png',
      min: c.MIN_OXYGEN_LEVEL, max: c.MAX_OXYGEN_LEVEL, value: levels.oxygen, text: levels.oxygen + ' %',
      bonuses: [{at: c.OXYGEN_LEVEL_FOR_TEMPERATURE_BONUS, kind: 'temperature', title: 'Temperature'}],
    },
    {
      key: 'oceans', label: 'Oceans', icon: 'assets/tiles/ocean.png',
      min: 0, max: c.MAX_OCEAN_TILES, value: levels.oceans, text: levels.oceans + '/' + c.MAX_OCEAN_TILES,
      bonuses: [],
    },
  ];
  if (levels.venus !== undefined) {
    specs.push({
      key: 'venus', label: 'Venus', icon: 'assets/global-parameters/venus.png',
      min: c.MIN_VENUS_SCALE, max: c.MAX_VENUS_SCALE, value: levels.venus, text: levels.venus + ' %',
      bonuses: [
        {at: c.VENUS_LEVEL_FOR_CARD_BONUS, kind: 'card', title: 'Card'},
        {at: c.VENUS_LEVEL_FOR_TR_BONUS, kind: 'tr', title: 'Terraform rating'},
      ],
    });
  }
  return specs.map(build);
}
