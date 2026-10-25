import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';
import {ICard} from '../cards/ICard';
import {isIProjectCard} from '../cards/IProjectCard';
import {Tag} from '../../common/cards/Tag';
import {tuningOf} from './aiTuning';
import {remainingProductionPhases, victoryPointValue} from './gameProgress';

// Tags as a stock for later (strong players' rule): early, building tags count while the Builder milestone is
// still open; after that science and power tags, because most requirements of the cards still to come ask for
// them. A tag counted only when a hand card needed it right now (enablerValue.ts) or scored VP (tagPointOutlook.ts),
// so a cheap science card was worth no more than a cheap production card.

/** Milestones that count tags: name → tag. */
const TAG_MILESTONES: Readonly<Record<string, Tag>> = {
  'Builder': Tag.BUILDING,
  'Builder7': Tag.BUILDING,
};
/** M€ a card with a requirement on a tag adds to that tag's stock value when every card had one (scaled by share). */
const REQUIREMENT_VALUE = 60;
/** Chance to win a milestone race that is still open. */
const MILESTONE_CHANCE = 0.5;
const MILESTONE_POINTS = 5;
/** Generations over which a tag stock still pays off fully. */
const FULL_VALUE_GENERATIONS = 6;

type Shares = {generation: number, shares: Map<Tag, number>};
const sharesByGame = new WeakMap<IGame, Shares>();

/** Share of the cards still in the deck that require each tag (minimum requirements only). */
function requirementShares(game: IGame): Map<Tag, number> {
  const cached = sharesByGame.get(game);
  if (cached !== undefined && cached.generation === game.generation) {
    return cached.shares;
  }
  const cards = [...game.projectDeck.drawPile, ...game.projectDeck.discardPile];
  const counts = new Map<Tag, number>();
  for (const card of cards) {
    if (!isIProjectCard(card)) {
      continue;
    }
    const tags = new Set(card.requirements.filter((requirement) => requirement.tag !== undefined && requirement.max !== true).map((requirement) => requirement.tag as Tag));
    tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
  }
  const shares = new Map<Tag, number>();
  counts.forEach((count, tag) => shares.set(tag, cards.length > 0 ? count / cards.length : 0));
  sharesByGame.set(game, {generation: game.generation, shares});
  return shares;
}

/** M€ one more tag of this kind is worth to the player now: open tag milestones plus later requirements. */
export function tagStockValue(player: IPlayer, tag: Tag): number {
  const game = player.game;
  const remaining = remainingProductionPhases(game, player);
  if (remaining <= 0) {
    return 0;
  }
  let value = (requirementShares(game).get(tag) ?? 0) * REQUIREMENT_VALUE * Math.min(1, remaining / FULL_VALUE_GENERATIONS);
  if (!game.allMilestonesClaimed()) {
    for (const milestone of game.milestones) {
      if (TAG_MILESTONES[milestone.name] !== tag || game.claimedMilestones.some((claimed) => claimed.milestone.name === milestone.name)) {
        continue;
      }
      const threshold = milestone.thresholdFor?.(game) ?? milestone.threshold;
      if (threshold - milestone.getScore(player) > 0) {
        value += MILESTONE_CHANCE * MILESTONE_POINTS * victoryPointValue(game, player) / threshold;
      }
    }
  }
  return value;
}

/** tagDemand: value of the tags a card brings as a stock for later requirements and tag milestones; 0 = off. */
export function tagDemandValue(player: IPlayer, card: ICard): number {
  const weight = tuningOf(player).tagDemand;
  if (weight <= 0 || card.tags.length === 0) {
    return 0;
  }
  return weight * card.tags.reduce((sum, tag) => sum + tagStockValue(player, tag), 0);
}
