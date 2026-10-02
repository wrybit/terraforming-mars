// Line colors and legend symbols of the history charts on the results page (VictoryPointChart.vue).
import {Color} from '@/common/Color';
import {GlobalParameter} from '@/common/GlobalParameter';

// Player colors as line color (black as light grey, otherwise invisible on the dark background)
export const PLAYER_CHART_COLORS: Record<Color, string> = {
  ['red']: 'rgb(153, 17, 0)',
  ['yellow']: 'rgb(170, 170, 0)',
  ['green']: 'rgb(0, 153, 0)',
  ['black']: 'rgb(170, 170, 170)',
  ['blue']: 'rgb(0, 102, 255)',
  ['purple']: 'rgb(140, 0, 255)',
  ['orange']: 'rgb(236, 113, 12)',
  ['pink']: 'rgb(245, 116, 187)',

  // Not real player colors
  ['neutral']: '',
  ['bronze']: '',
};

export type GlobalParameterChartStyle = {
  color: string;
  // Symbol next to the name in the legend; height/width in pixels for the legend
  icon?: {url: string, width: number, height: number};
};

// Global parameters deliberately in colors no player can have – otherwise the line would be mistaken for a player
const LEGEND_ICON_HEIGHT = 20;
function icon(url: string, naturalWidth: number, naturalHeight: number) {
  return {url, width: Math.round(LEGEND_ICON_HEIGHT * naturalWidth / naturalHeight), height: LEGEND_ICON_HEIGHT};
}

export const GLOBAL_PARAMETER_CHART_STYLES: Record<GlobalParameter, GlobalParameterChartStyle> = {
  [GlobalParameter.TEMPERATURE]: {color: 'rgb(242, 179, 61)', icon: icon('assets/global-parameters/temperature.png', 163, 547)},
  [GlobalParameter.OXYGEN]: {color: 'rgb(181, 230, 85)', icon: icon('assets/global-parameters/oxygen.png', 475, 476)},
  [GlobalParameter.OCEANS]: {color: 'rgb(111, 214, 255)', icon: icon('assets/tiles/ocean.png', 418, 483)},
  [GlobalParameter.VENUS]: {color: 'rgb(235, 235, 235)', icon: icon('assets/global-parameters/venus.png', 775, 432)},
  [GlobalParameter.MOON_HABITAT_RATE]: {color: 'rgb(192, 133, 82)'},
  [GlobalParameter.MOON_MINING_RATE]: {color: 'rgb(141, 110, 99)'},
  [GlobalParameter.MOON_LOGISTIC_RATE]: {color: 'rgb(77, 182, 172)'},
};
