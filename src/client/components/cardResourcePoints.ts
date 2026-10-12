import {CardName} from '@/common/cards/CardName';
import {getCard} from '@/client/cards/ClientCardManifest';

// Victory points a card scores for the resources on it (Fish: 1 VP per animal, Tardigrades: 1 VP per
// 4 microbes). A choice tile shows them next to the card count, so adding a resource is visibly worth
// more than e.g. one plant (ChoiceOptionTile.vue).
export type CardResourcePoints = {
  before: number,
  after: number,
  // Resources needed per point step; > 1 shows the progress towards the next point
  per: number,
  // Resources counted towards the next point after the option (e.g. 2 of 4)
  progress: number,
};

// Same rounding as the server (Counter.ts): count × each, then whole steps of per
function points(count: number, each: number, per: number): number {
  return Math.floor((count * each) / per);
}

// undefined if the card does not score per resource on it
export function cardResourcePoints(card: CardName | undefined, count: {before: number, after: number}): CardResourcePoints | undefined {
  const victoryPoints = card === undefined ? undefined : getCard(card)?.victoryPoints;
  if (typeof victoryPoints !== 'object' || victoryPoints.resourcesHere === undefined) {
    return undefined;
  }
  const each = victoryPoints.each ?? 1;
  const per = victoryPoints.per ?? 1;
  return {
    before: points(count.before, each, per),
    after: points(count.after, each, per),
    per,
    progress: count.after % per,
  };
}
