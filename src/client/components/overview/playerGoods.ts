import {Resource} from '@/common/Resource';
import {CardName} from '@/common/cards/CardName';
import {Protection, PublicPlayerModel} from '@/common/models/PlayerModel';
import {DEFAULT_STEEL_VALUE, DEFAULT_TITANIUM_VALUE} from '@/common/constants';
import {getPreferences} from '@/client/utils/PreferencesManager';

// Eine Ware eines Spielers: Vorrat, Produktion, Wert je Einheit und Schutz.
// Gemeinsame Quelle für die klassische Ressourcenleiste (PlayerResources) und die Tabelle im
// Zwei-Spalten-Layout (PlayersTable), damit beide dieselben Werte und Regeln zeigen.
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

// Wert je Einheit nur zeigen, wenn er vom Normalwert abweicht (oder im Lernmodus immer)
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
