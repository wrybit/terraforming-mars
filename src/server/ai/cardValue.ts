import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {IProjectCard, isIProjectCard} from '../cards/IProjectCard';
import {isICorporationCard} from '../cards/corporation/ICorporationCard';
import {CardRequirements} from '../cards/requirements/CardRequirements';
import {CardName} from '../../common/cards/CardName';
import {newCard} from '../createCard';
import {finishMove, snapshotOf, withCopy} from './gameCopy';
import {relativeValue, valuationContext} from './stateValue';
import {cardPriorFactor} from './cardPriors';
import {remainingProductionPhases} from './gameProgress';

// What a card is worth to a player *before* it can be played: used for the opening, the draft
// and buying cards. The card is put into play on a copy of the game (ignoring requirements and
// cost), the position is valued, and the result is corrected by cost, requirement distance and
// the BGA prior (docs/ai/bot-heuristics.md §2).

function requirementsMet(card: IProjectCard, player: IPlayer): boolean {
  if (card.requirements.length === 0) {
    return true;
  }
  try {
    return CardRequirements.compile([...card.requirements]).satisfies(player, card);
  } catch {
    return true;
  }
}

/** Share of a card's value that survives because its requirements may never be met in time. */
function requirementFactor(card: ICard, player: IPlayer): number {
  if (!isIProjectCard(card) || requirementsMet(card, player)) {
    return 1;
  }
  return remainingProductionPhases(player.game) >= 4 ? 0.6 : 0.25;
}

export function estimateCardValues(player: IPlayer, cards: ReadonlyArray<ICard>): Map<CardName, number> {
  const snapshot = snapshotOf(player.game);
  const context = valuationContext(player.game);
  const baseline = withCopy(snapshot, (copy) => relativeValue(copy.getPlayerById(player.id), context));
  const values = new Map<CardName, number>();
  for (const card of cards) {
    const gain = withCopy(snapshot, (copy) => {
      const copyPlayer = copy.getPlayerById(player.id);
      copyPlayer.clearWaitingFor();
      try {
        const fresh = newCard(card.name);
        if (isICorporationCard(fresh)) {
          copyPlayer.playCorporationCard(fresh);
        } else {
          copyPlayer.playCard(fresh as IProjectCard);
        }
        copy.deferredActions.runAll(() => {});
        finishMove(copy, copyPlayer);
      } catch {
        return undefined;
      }
      return relativeValue(copyPlayer, context) - baseline;
    });
    const cost = isIProjectCard(card) && !isICorporationCard(card) ? player.getCardCost(card) : 0;
    const raw = gain === undefined ? 0 : gain * cardPriorFactor(card.name) - cost;
    values.set(card.name, raw > 0 ? raw * requirementFactor(card, player) : raw);
  }
  return values;
}
