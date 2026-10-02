import {Resource} from '@/common/Resource';
import {CardName} from '@/common/cards/CardName';
import {Protection, PublicPlayerModel} from '@/common/models/PlayerModel';
import {DEFAULT_STEEL_VALUE, DEFAULT_TITANIUM_VALUE} from '@/common/constants';
import {getPreferences} from '@/client/utils/PreferencesManager';

// One good of a player: stock, production, value per unit and protection.
// Shared source for the classic resource bar (PlayerResources) and the table in the
// two-column layout (PlayersTable), so both show the same values and rules.
export type PlayerGood = {
  type: Resource;
  count: number;
  production: number;
  value: number;
  resourceProtection: Protection;
  productionProtection: Protection;
};

export function playerGoods(player: PublicPlayerModel): Array<PlayerGood> {
  // TODO LUNA TRADE FEDERATION
  const canUseHeatAsMegaCredits = player.tableau.some((card) => card.name === CardName.HELION);
  const good = (type: Resource, count: number, production: number, value = 0): PlayerGood => ({
    type,
    count,
    production,
    value,
    resourceProtection: player.protectedResources[type],
    productionProtection: player.protectedProduction[type],
  });
  return [
    good(Resource.MEGACREDITS, player.megacredits, player.megacreditProduction),
    good(Resource.STEEL, player.steel, player.steelProduction, player.steelValue),
    good(Resource.TITANIUM, player.titanium, player.titaniumProduction, player.titaniumValue),
    good(Resource.PLANTS, player.plants, player.plantProduction),
    good(Resource.ENERGY, player.energy, player.energyProduction),
    good(Resource.HEAT, player.heat, player.heatProduction, canUseHeatAsMegaCredits ? 1 : 0),
  ];
}

// Only show value per unit if it differs from the default (or always in learner mode)
export function shouldShowResourceValue(type: Resource, value: number): boolean {
  const learnerModeOn = getPreferences().learner_mode;
  switch (type) {
  case Resource.STEEL:
    return learnerModeOn || value > DEFAULT_STEEL_VALUE;
  case Resource.TITANIUM:
    return learnerModeOn || value > DEFAULT_TITANIUM_VALUE;
  case Resource.HEAT:
    return value > 0;
  default:
    return false;
  }
}
