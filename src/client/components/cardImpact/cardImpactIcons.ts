import {CardImpactResource} from '@/common/models/CardImpact';
import {CardResource} from '@/common/CardResource';
import {cardResourceCSS} from '@/client/components/common/cardResources';

// Icons of the impact lines: the same resource icons as the log's effect chips (log.less), so a "+3 plants"
// looks identical in the footer and in the log afterwards
const LOG_RESOURCE_ICONS: Partial<Record<string, string>> = {
  megacredits: 'megacredit',
  steel: 'steel',
  titanium: 'titanium',
  plants: 'plant',
  energy: 'power',
  heat: 'heat',
  cards: 'card',
  [CardResource.ANIMAL]: 'animal',
  [CardResource.MICROBE]: 'microbe',
  [CardResource.FLOATER]: 'floater',
  [CardResource.SCIENCE]: 'science',
  [CardResource.ASTEROID]: 'asteroid',
  [CardResource.FIGHTER]: 'fighter',
  [CardResource.DATA]: 'data',
  [CardResource.CAMP]: 'camp',
  [CardResource.DISEASE]: 'disease',
};

// Things without a resource icon in the log: own icons (card_impact.less)
const OWN_ICONS: Partial<Record<CardImpactResource, string>> = {
  tr: 'card-impact-icon--tr',
  ocean: 'log-effect-tile--ocean',
  colony: 'card-impact-icon--colony',
  temperature: 'card-impact-icon--temperature',
};

export function impactIconClass(resource: CardImpactResource): string {
  const logIcon = LOG_RESOURCE_ICONS[resource];
  if (logIcon !== undefined) {
    return 'log-effect-icon log-effect-resource--' + logIcon;
  }
  const own = OWN_ICONS[resource];
  if (own !== undefined) {
    return 'log-effect-icon ' + own;
  }
  // Rare card resources: the icon of the card resource itself
  return 'log-effect-icon card-resource ' + (cardResourceCSS[resource as CardResource] ?? '');
}
