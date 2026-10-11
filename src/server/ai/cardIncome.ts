import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {Tag} from '../../common/cards/Tag';

// Card income: cards that keep bringing cards (Point Luna, Olympus Conference, Mars University,
// Development Center …) work like production – every generation they give cards that otherwise
// cost 3 M€ each to buy. Human players play about three times as many of them as the AI and draw
// about 1.2 cards per generation against 0.3 (all recorded human games); the AI valued such an
// effect as a flat 1 M€ per generation.
//
// The trigger and the cards drawn are read from the card's icon row (render data), so every card
// with "tag : + card" is covered without a card list.

type Token = {type?: string, is?: string, tag?: string, amount?: number};

/** Icon tokens of a card in reading order (strings and empty rows dropped). */
function tokens(node: unknown, out: Array<Token> = []): Array<Token> {
  if (Array.isArray(node)) {
    node.forEach((child) => tokens(child, out));
  } else if (node !== null && typeof node === 'object') {
    const item = node as Token & {rows?: unknown};
    if (item.rows !== undefined) {
      tokens(item.rows, out);
    } else {
      out.push(item);
    }
  }
  return out;
}

export type DrawTrigger = {tag: Tag, cards: number};

const triggerCache = new Map<string, Array<DrawTrigger>>();

/**
 * Tag-triggered card draws of a card: "science : + 1 card" → {science, 1}. A choice ("OR", as on
 * Olympus Conference: a resource or a card) counts half; a swap ("− card + card", Mars University)
 * only improves the hand and counts a third.
 */
export function drawTriggers(card: ICard): Array<DrawTrigger> {
  const cached = triggerCache.get(card.name);
  if (cached !== undefined) {
    return cached;
  }
  const list = tokens(card.metadata?.renderData);
  const triggers: Array<DrawTrigger> = [];
  list.forEach((token, index) => {
    if (token.type !== ':') {
      return;
    }
    const tag = list.slice(Math.max(0, index - 3), index).reverse().find((before) => before.type === 'tag')?.tag;
    if (tag === undefined) {
      return;
    }
    const end = list.findIndex((after, position) => position > index && (after.type === ':' || after.type === '->'));
    const effect = list.slice(index + 1, end < 0 ? undefined : end);
    let drawn = 0;
    let discarded = false;
    effect.forEach((item, position) => {
      if (item.type === 'cards') {
        if (effect[position - 1]?.type === '-') {
          discarded = true;
        } else {
          drawn += item.amount ?? 1;
        }
      }
    });
    if (drawn === 0) {
      return;
    }
    const choice = effect.some((item) => item.type === 'OR') ? 0.5 : 1;
    triggers.push({tag: tag as Tag, cards: drawn * choice * (discarded ? 1 / 3 : 1)});
  });
  triggerCache.set(card.name, triggers);
  return triggers;
}

/** Typical tags of one kind per generation before the own pace is known (about 3 cards a generation). */
const TAG_PRIOR_PER_GENERATION = 0.4;
/** Generations the prior counts as, so a few early tags do not decide alone. */
const PRIOR_WEIGHT = 2;
/** Share of the tagged hand cards that typically get played in the next generation. */
const HAND_PLAY_SHARE = 0.3;

/** Own tags of this kind per generation: past pace blended with a prior, plus tagged cards in hand. */
export function tagPace(player: IPlayer, tag: Tag): number {
  const elapsed = Math.max(0, player.game.generation - 1);
  const played = player.tags.count(tag, 'raw');
  const inHand = player.cardsInHand.filter((card) => card.tags.includes(tag)).length;
  return (played + TAG_PRIOR_PER_GENERATION * PRIOR_WEIGHT) / (elapsed + PRIOR_WEIGHT) + inHand * HAND_PLAY_SHARE / Math.max(1, elapsed);
}

/** Cards a played effect card draws per generation from the player's own tags. */
export function effectDrawsPerGeneration(card: ICard, player: IPlayer): number {
  return drawTriggers(card).reduce((sum, trigger) => sum + trigger.cards * tagPace(player, trigger.tag), 0);
}
