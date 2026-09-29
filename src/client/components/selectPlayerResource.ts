import {Message} from '@/common/logs/Message';
import {ALL_RESOURCES, Resource} from '@/common/Resource';
import {PublicPlayerModel} from '@/common/models/PlayerModel';

// Ressourcen-Wörter in englischen Titel-Schlüsseln ohne Parameter (z. B. "Select player to remove up to 4 M€ from")
const RESOURCE_WORDS: ReadonlyArray<[RegExp, Resource]> = [
  [/M€/, Resource.MEGACREDITS],
  [/\bsteel\b/i, Resource.STEEL],
  [/\btitanium\b/i, Resource.TITANIUM],
  [/\bplants?\b/i, Resource.PLANTS],
  [/\benergy\b/i, Resource.ENERGY],
  [/\bheat\b/i, Resource.HEAT],
];

// Um welche Ressource es bei einer Spielerwahl geht (z. B. "Stahl-Produktion senken", "Pflanzen stehlen"),
// damit die Spieler-Kacheln (PlayerOptionTile.vue) Bestand und Produktion genau dieser Ressource zeigen.
// Meist schreibt der Server die Ressource als Parameter in den Titel (DecreaseAnyProduction, StealResources …),
// manche Karten nennen sie nur im Text (CometForVenus) – dann zählt das Wort im Titel-Schlüssel.
export function selectPlayerResource(title: string | Message): Resource | undefined {
  if (typeof title !== 'string') {
    for (const datum of title.data) {
      const value = datum.value;
      if (typeof value === 'string' && (ALL_RESOURCES as ReadonlyArray<string>).includes(value)) {
        return value as Resource;
      }
    }
  }
  const text = typeof title === 'string' ? title : title.message;
  return RESOURCE_WORDS.find(([pattern]) => pattern.test(text))?.[1];
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
