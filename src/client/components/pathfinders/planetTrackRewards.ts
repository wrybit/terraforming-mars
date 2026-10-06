// Pathfinders rewards as track bonus chips (TrackBonusChip): what whoever moves the track there gets ("own"),
// what everyone gets ("everyone"), handed out ones grey.
import {Reward} from '@/common/pathfinders/Reward';
import {PlanetaryTrackSpace} from '@/common/pathfinders/PlanetaryTrack';
import {BONUS_ICON, LaneEntry, TrackBonus} from '@/client/components/trackBonus/trackBonus';

export function rewardBonus(reward: Reward, turmoil: boolean): TrackBonus {
  switch (reward) {
  case '1vp':
    return {icons: [], victoryPoints: 1};
  case '2vp':
    return {icons: [], victoryPoints: 2};
  case '3mc':
    return {icons: [BONUS_ICON.megacredits], count: 3};
  case '6mc':
    return {icons: [BONUS_ICON.megacredits], count: 6};
  case 'any_resource':
  case 'resource':
    return {icons: [BONUS_ICON.any]};
  case 'card':
    return {icons: [BONUS_ICON.card]};
  case 'city':
    return {icons: [BONUS_ICON.city]};
  // Without Turmoil a delegate is worth 3 M€ (PlanetaryTrackRewards.vue)
  case 'delegate':
    return turmoil ? {icons: [BONUS_ICON.delegate]} : {icons: [BONUS_ICON.megacredits], count: 3};
  case 'energy':
    return {icons: [BONUS_ICON.energy]};
  case 'energy_production':
    return {icons: [BONUS_ICON.energy], production: true};
  case 'floater':
    return {icons: [BONUS_ICON.floater]};
  case 'greenery':
    return {icons: [BONUS_ICON.greenery]};
  case 'heat':
    return {icons: [BONUS_ICON.heat]};
  case 'heat_production':
    return {icons: [BONUS_ICON.heat], production: true};
  case 'moon_road':
    return {icons: ['moon/play-roadtile.png']};
  case 'moon_mine':
    return {icons: ['moon/play-minetile.png']};
  case 'ocean':
    return {icons: [BONUS_ICON.ocean]};
  case 'plant':
    return {icons: [BONUS_ICON.plant]};
  case 'plant_production':
    return {icons: [BONUS_ICON.plant], production: true};
  case 'steel':
    return {icons: [BONUS_ICON.steel]};
  case 'steel_production':
    return {icons: [BONUS_ICON.steel], production: true};
  case 'titanium':
    return {icons: [BONUS_ICON.titanium]};
  case 'titanium_production':
    return {icons: [BONUS_ICON.titanium], production: true};
  case 'tr':
    return {icons: [BONUS_ICON.tr]};
  case 'venus_scale':
    return {icons: [BONUS_ICON.venus]};
  }
}

// Chips of all reward spaces of one track; spaces up to the marker are handed out
export function trackLane(spaces: ReadonlyArray<PlanetaryTrackSpace>, position: number, turmoil: boolean): Record<number, Array<LaneEntry>> {
  const lane: Record<number, Array<LaneEntry>> = {};
  spaces.forEach((space, index) => {
    const done = index <= position;
    const own = [...space.risingPlayer, ...space.mostTags].map((reward): LaneEntry => ({bonus: rewardBonus(reward, turmoil), kind: done ? 'done' : 'own'}));
    const everyone = space.everyone.map((reward): LaneEntry => ({bonus: rewardBonus(reward, turmoil), kind: done ? 'done' : 'everyone'}));
    if (own.length + everyone.length > 0) {
      lane[index] = [...own, ...everyone];
    }
  });
  return lane;
}

export function isRewardSpace(space: PlanetaryTrackSpace | undefined): boolean {
  return space !== undefined && space.risingPlayer.length + space.everyone.length + space.mostTags.length > 0;
}
