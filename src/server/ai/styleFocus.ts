import {IPlayer} from '../IPlayer';
import {tuningOf} from './aiTuning';

// Strategy focus: an extra value, in VP, for the things one strategy style is obsessed with. Shifting existing
// weights changed little (round 100: a "card engine" played 46.9 instead of 45.8 cards) because the shared valuation
// of VP, TR and production dominates every move. A focus adds a clear pull of its own to the deciding player's value,
// so the styles really play differently – like human players who commit to one plan (strategyStyles.ts).
export type StyleFocus = {
  /** VP per card in play (events included) and per card in hand. */
  playedCard: number,
  handCard: number,
  /** VP per TR step. */
  terraformRating: number,
  /** VP per production step of any resource. */
  production: number,
  /** VP per own greenery and per own city tile. */
  greenery: number,
  city: number,
  /** VP per claimed milestone and per funded award. */
  milestone: number,
  fundedAward: number,
};

/** Extra value (in M€) of the player's position for the player's own strategy focus (aiTuning.ts styleFocus). */
export function styleFocusValue(player: IPlayer, victoryPoint: number): number {
  const focus = tuningOf(player).styleFocus;
  // Most players have no focus: skip the board scans then (valuations run thousands of times per move).
  if (focus === undefined || Object.values(focus).every((weight) => weight === 0)) {
    return 0;
  }
  const game = player.game;
  const production = player.production;
  const productionSteps = production.megacredits + production.steel + production.titanium + production.plants +
    production.energy + production.heat;
  const points = focus.playedCard * player.playedCards.length +
    focus.handCard * player.cardsInHand.length +
    focus.terraformRating * player.terraformRating +
    focus.production * productionSteps +
    focus.greenery * game.board.getGreeneries(player).length +
    focus.city * game.board.getCities(player).length +
    focus.milestone * game.claimedMilestones.filter((claimed) => claimed.player.id === player.id).length +
    focus.fundedAward * game.fundedAwards.filter((funded) => funded.player.id === player.id).length;
  return points * victoryPoint;
}
