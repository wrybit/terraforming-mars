import {ClientCard} from '@/common/cards/ClientCard';

// A "*" in the icon row marks a special rule in the card text (shown as a note, see cardTextMarkup.ts)
function containsAsterisk(component: unknown): boolean {
  if (Array.isArray(component)) {
    return component.some(containsAsterisk);
  }
  if (component !== null && typeof component === 'object') {
    const record = component as Record<string, unknown>;
    if (record.is === 'symbol' && record.type === '*') {
      return true;
    }
    return Object.values(record).some(containsAsterisk);
  }
  return false;
}

export function hasAsteriskRule(card: ClientCard): boolean {
  return containsAsterisk(card.metadata.renderData);
}
