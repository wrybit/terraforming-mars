import {GlobalParameterTracks} from '@/common/boards/GlobalParameterTracks';
import {IPlayer} from '@/server/IPlayer';
import {PlaceOceanTile} from '@/server/deferredActions/PlaceOceanTile';
import {BuildColony} from '@/server/deferredActions/BuildColony';
import {Phase} from '@/common/Phase';

// The track data lives in common (the client draws the same bonuses next to the scales)
export {getGlobalParameterTracks} from '@/common/boards/GlobalParameterTracks';
export type {GlobalParameterTrackBonus, GlobalParameterThreshold, GlobalParameterTracks} from '@/common/boards/GlobalParameterTracks';

/** Grants the bonuses on the `type` track crossed when it rises from `from` to `to`. */
export function grantGlobalParameterTrackBonuses(
  player: IPlayer,
  type: keyof GlobalParameterTracks,
  from: number,
  to: number): void {
  const solar = player.game.phase === Phase.SOLAR;
  const thresholds = player.game.globalParameterTracks[type];
  for (const {value, bonus} of thresholds) {
    if (from >= value || to < value) {
      continue;
    }
    switch (bonus) {
    case 'drawcard':
      if (!solar) {
        player.drawCard();
      }
      break;
    case 'heatproduction':
      if (!solar) {
        player.production.add('heat', 1, {log: true});
      }
      break;
    case 'plant':
      if (!solar) {
        player.production.add('plants', 1, {log: true});
      }
      break;
    case 'colony':
      if (!solar) {
        player.game.defer(new BuildColony(player));
      }
      break;
    case 'ocean':
      player.game.defer(new PlaceOceanTile(player, {title: 'Select space for ocean from temperature increase'}));
      break;
    case 'temperature':
      player.game.increaseTemperature(player, 1);
      break;
    case 'tr':
      if (!solar) {
        player.increaseTerraformRating(1);
      }
      break;
    default:
      throw new Error('Unknown value: ' + bonus);
    }
  }
}
