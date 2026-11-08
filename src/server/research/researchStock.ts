import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {Phase} from '../../common/Phase';

/**
 * Public stock of a player at the start of their card purchase in the research phase.
 * While others are still buying, everyone else sees these values instead of the current ones:
 * otherwise M€ and hand size give away how many cards a player bought (the log hides it too).
 */
export type ResearchStock = {
  megaCredits: number,
  steel: number,
  titanium: number,
  plants: number,
  energy: number,
  heat: number,
  cardsInHand: number,
  /** Cards offered for purchase; the ones not bought go to the discard pile */
  offered: number,
};

export function takeResearchStock(player: IPlayer, offered: number): ResearchStock {
  return {
    megaCredits: player.megaCredits,
    steel: player.steel,
    titanium: player.titanium,
    plants: player.plants,
    energy: player.energy,
    heat: player.heat,
    cardsInHand: player.cardsInHand.length,
    offered: offered,
  };
}

/** The purchase of this player is done, but the phase still runs: their result stays secret. */
function purchaseIsSecret(player: IPlayer): boolean {
  const game = player.game;
  return game.phase === Phase.RESEARCH && game.generation > 1 && game.hasResearched(player) && player.researchStock !== undefined;
}

/** Stock to show to the reader instead of the current one; undefined when the reader may see the real values. */
export function concealedStock(player: IPlayer, reader: IPlayer | undefined): ResearchStock | undefined {
  if (reader?.id === player.id || !purchaseIsSecret(player)) {
    return undefined;
  }
  return player.researchStock;
}

/** Discard pile without the cards not bought in the running research phase – their number would give away the purchases. */
export function visibleDiscardPileSize(game: IGame): number {
  let size = game.projectDeck.discardPile.length;
  for (const player of game.players) {
    const stock = player.researchStock;
    if (stock !== undefined && purchaseIsSecret(player)) {
      const bought = Math.max(0, player.cardsInHand.length - stock.cardsInHand);
      size -= Math.max(0, stock.offered - bought);
    }
  }
  return Math.max(0, size);
}
