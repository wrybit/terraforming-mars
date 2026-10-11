import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';
import {ICard} from '../cards/ICard';
import {IProjectCard, isIProjectCard} from '../cards/IProjectCard';
import {CardType} from '../../common/cards/CardType';
import {CardName} from '../../common/cards/CardName';
import {newCard} from '../createCard';
import {finishMove, GameSnapshot, withCopy} from './gameCopy';
import {relativeValue, ValuationContext} from './stateValue';
import {isSimulating} from './simulationSandbox';

// Play order of effect cards and the cards that trigger them. Decomposers before Lichen gives a
// microbe, Research Outpost before any card saves 1 M€, Arctic Algae before an ocean gives plants.
// Human feedback: the AI played Lichen first and Decomposers right after. In saved human games
// the AI played a card before an effect card it could already play and that the card would have
// triggered in 4.8 % of its plays, the humans in 2.2 %.
//
// The position value counts an effect card in play with a flat amount per generation, so it does
// not see which cards in hand would trigger it. The gain of each pair (effect card B, hand card A)
// is measured on game copies: A played with B already in play against A played alone.
// - Playing A while B is playable gives that gain up: A gets a penalty.
// - Playing B makes the gain available for the hand cards still to be played: B gets a bonus.

/** The copies get extra money so paying never fails and money counts the same in both. */
const EXTRA_MONEY = 150;
/** Hand cards that cannot be played now may never be played: their gain counts half. */
const LATER_SHARE = 0.5;

/** Effect cards that react to other cards: tags played, discounts, tiles placed. */
export function hasTriggerEffect(card: ICard): boolean {
  return isIProjectCard(card) && card.type === CardType.ACTIVE &&
    (card.onCardPlayed !== undefined || card.getCardDiscount !== undefined || card.cardDiscount !== undefined || card.onTilePlaced !== undefined);
}

function playPaid(copy: IGame, copyPlayer: IPlayer, name: CardName): void {
  const card = newCard(name) as IProjectCard;
  copyPlayer.megaCredits -= copyPlayer.getCardCost(card);
  copyPlayer.playCard(card);
  copy.deferredActions.runAll(() => {});
  finishMove(copy, copyPlayer);
}

/** Value of playing `target` (paid), optionally with `trigger` already in play. */
function targetValue(snapshot: GameSnapshot, player: IPlayer, context: ValuationContext, target: CardName, trigger: CardName | undefined): number | undefined {
  return withCopy(snapshot, (copy) => {
    const copyPlayer = copy.getPlayerById(player.id);
    copyPlayer.clearWaitingFor();
    copyPlayer.megaCredits += EXTRA_MONEY;
    try {
      if (trigger !== undefined) {
        copyPlayer.playCard(newCard(trigger) as IProjectCard);
        copy.deferredActions.runAll(() => {});
        finishMove(copy, copyPlayer);
      }
      const before = relativeValue(copyPlayer, context);
      playPaid(copy, copyPlayer, target);
      return relativeValue(copyPlayer, context) - before;
    } catch {
      return undefined;
    }
  });
}

// Gains change little within a generation; measured once per game, generation and pair.
const gainCache = new Map<string, number>();

/** What `target` brings more when `trigger` is already in play (0 when it triggers nothing). */
export function triggerGain(snapshot: GameSnapshot, player: IPlayer, context: ValuationContext, trigger: CardName, target: CardName): number {
  const key = `${player.game.id}|${player.id}|${player.game.generation}|${trigger}|${target}`;
  const cached = isSimulating() ? undefined : gainCache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const without = targetValue(snapshot, player, context, target, undefined);
  const withTrigger = targetValue(snapshot, player, context, target, trigger);
  // Harmful triggers (an opponent's card, Vermin) are left to the normal valuation.
  const gain = without === undefined || withTrigger === undefined ? 0 : Math.max(0, withTrigger - without);
  if (!isSimulating()) {
    if (gainCache.size > 5000) {
      gainCache.clear();
    }
    gainCache.set(key, gain);
  }
  return gain;
}

/**
 * Value change per hand card played now: a penalty (negative) for a card that an effect card
 * playable now would trigger, a bonus for an effect card that hand cards would trigger.
 */
export function triggerOrderAdjustments(snapshot: GameSnapshot, player: IPlayer, context: ValuationContext, playable: ReadonlySet<CardName>,
  penaltyWeight: number, bonusWeight: number): Map<CardName, number> {
  const adjustments = new Map<CardName, number>();
  const hand = player.cardsInHand.filter(isIProjectCard);
  const triggers = hand.filter((card) => playable.has(card.name) && hasTriggerEffect(card));
  for (const trigger of triggers) {
    for (const target of hand) {
      if (target.name === trigger.name) {
        continue;
      }
      const gain = triggerGain(snapshot, player, context, trigger.name, target.name);
      if (gain <= 0) {
        continue;
      }
      const targetPlayable = playable.has(target.name);
      if (targetPlayable && penaltyWeight > 0) {
        adjustments.set(target.name, (adjustments.get(target.name) ?? 0) - penaltyWeight * gain);
      }
      if (bonusWeight > 0) {
        const share = targetPlayable ? 1 : LATER_SHARE;
        adjustments.set(trigger.name, (adjustments.get(trigger.name) ?? 0) + bonusWeight * share * gain);
      }
    }
  }
  return adjustments;
}
