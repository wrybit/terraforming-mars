import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';
import {ICard} from '../cards/ICard';
import {IProjectCard, isIProjectCard} from '../cards/IProjectCard';
import {CardType} from '../../common/cards/CardType';
import {CardName} from '../../common/cards/CardName';
import {newCard} from '../createCard';
import {finishMove, GameSnapshot, withCopy} from './gameCopy';
import {relativeValue, ValuationContext} from './stateValue';
import {pickSome} from './randomChoice';
import {tuningOf} from './aiTuning';

// What an effect card (discount, card draw, resources on other plays) brings over the rest of
// the game. Playing the card alone on a game copy shows almost nothing of it: Earth Office,
// Earth Catapult or Olympus Conference only pay off with the cards played after them. A human
// with such an engine played 97 cards in a test game, the AI 46.
//
// Measured on two copies: both play the same sample of future project cards and pay for them;
// one copy has the effect card in play first. The difference, scaled to the cards still to come,
// is the engine value.

const SAMPLE_CARDS = 10;
/** At most this many of the sample come from the own hand (aiTuning.ts handSynergy). */
const HAND_SAMPLE_CARDS = 5;
// Cards a player plays per remaining generation (test batches: ~3 with the current buying).
const CARDS_PER_GENERATION = 2.5;
// The copies get extra money so paying never fails and money counts the same in both.
const EXTRA_MONEY = 150;

function playPaid(copy: IGame, copyPlayer: IPlayer, name: CardName): void {
  const card = newCard(name) as IProjectCard;
  copyPlayer.megaCredits -= copyPlayer.getCardCost(card);
  copyPlayer.playCard(card);
  copy.deferredActions.runAll(() => {});
  finishMove(copy, copyPlayer);
}

function sampleValue(snapshot: GameSnapshot, player: IPlayer, context: ValuationContext, sample: ReadonlyArray<CardName>, first: CardName | undefined): number | undefined {
  return withCopy(snapshot, (copy) => {
    const copyPlayer = copy.getPlayerById(player.id);
    copyPlayer.clearWaitingFor();
    copyPlayer.megaCredits += EXTRA_MONEY;
    try {
      if (first !== undefined) {
        copyPlayer.playCard(newCard(first) as IProjectCard);
        copy.deferredActions.runAll(() => {});
        finishMove(copy, copyPlayer);
      }
      const before = relativeValue(copyPlayer, context);
      for (const name of sample) {
        try {
          playPaid(copy, copyPlayer, name);
        } catch {
          // some cards cannot be forced into play; the sample just gets smaller
        }
      }
      return relativeValue(copyPlayer, context) - before;
    } catch {
      return undefined;
    }
  });
}

/** Extra value of an effect card from the cards played after it (0 for other cards). */
export function engineValue(snapshot: GameSnapshot, player: IPlayer, card: ICard, context: ValuationContext): number {
  if (!isIProjectCard(card) || card.type !== CardType.ACTIVE || context.remaining <= 1) {
    return 0;
  }
  const sample = withCopy(snapshot, (copy) => {
    // The own hand will be played too: Viral Enhancers is gold with a hand of plant, animal and
    // microbe cards (Martin), measured on random deck cards it looked average.
    const hand = tuningOf(player).handSynergy > 0 ?
      copy.getPlayerById(player.id).cardsInHand.filter((next) => next.name !== card.name).slice(0, HAND_SAMPLE_CARDS) : [];
    return [...hand, ...pickSome(Math.random, copy.projectDeck.drawPile, SAMPLE_CARDS - hand.length)].map((next) => next.name);
  });
  if (sample.length === 0) {
    return 0;
  }
  const without = sampleValue(snapshot, player, context, sample, undefined);
  const withCard = sampleValue(snapshot, player, context, sample, card.name);
  if (without === undefined || withCard === undefined) {
    return 0;
  }
  const futureCards = context.remaining * CARDS_PER_GENERATION;
  // Not clipped at 0: the measurement is noisy, clipping turned noise into extra value for every
  // effect card (A/B with clipping and full weight: 45 vs 58 seats won).
  return (withCard - without) * futureCards / sample.length;
}
