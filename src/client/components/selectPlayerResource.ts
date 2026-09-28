import {Message} from '@/common/logs/Message';
import {ALL_RESOURCES, Resource} from '@/common/Resource';
import {PublicPlayerModel} from '@/common/models/PlayerModel';

// Um welche Ressource es bei einer Spielerwahl geht (z. B. "Stahl-Produktion senken", "Pflanzen stehlen"),
// damit die Spieler-Kacheln (SelectPlayer.vue) Bestand und Produktion genau dieser Ressource zeigen.
// Der Server schreibt die Ressource als Parameter in den Titel (DecreaseAnyProduction, StealResources …).
export function selectPlayerResource(title: string | Message): Resource | undefined {
  if (typeof title === 'string') {
    return undefined;
  }
  for (const datum of title.data) {
    const value = datum.value;
    if (typeof value === 'string' && (ALL_RESOURCES as ReadonlyArray<string>).includes(value)) {
      return value as Resource;
    }
  }
  return undefined;
}

export type ResourceSnapshot = {stock: number, production: number};

// Bestand und Produktion eines Spielers für eine Ressource
export function resourceSnapshot(player: PublicPlayerModel, resource: Resource): ResourceSnapshot {
  switch (resource) {
  case 'megacredits': return {stock: player.megacredits, production: player.megacreditProduction};
  case 'steel': return {stock: player.steel, production: player.steelProduction};
  case 'titanium': return {stock: player.titanium, production: player.titaniumProduction};
  case 'plants': return {stock: player.plants, production: player.plantProduction};
  case 'energy': return {stock: player.energy, production: player.energyProduction};
  case 'heat': return {stock: player.heat, production: player.heatProduction};
  }
}
