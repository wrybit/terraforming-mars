import {Color} from '@/common/Color';
import {PLAYER_CHART_COLORS} from '@/client/components/gameend/chartStyles';

// Player colours of the replay graph: the chart colours of the results page, 20 % lighter like the milestone
// icons of the lobby timeline, so they stay clear on the dark glass
export function replayColor(color: Color): string {
  const match = /rgb\((\d+), (\d+), (\d+)\)/.exec(PLAYER_CHART_COLORS[color] ?? '');
  if (match === null) {
    return '#ddd';
  }
  const lighten = (value: string) => Math.round(Number(value) + (255 - Number(value)) * 0.2);
  return `rgb(${lighten(match[1])}, ${lighten(match[2])}, ${lighten(match[3])})`;
}
