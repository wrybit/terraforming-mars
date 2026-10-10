import {CardName} from '../../common/cards/CardName';

// Card memory from the draft: the cards an AI passed on went to the next player, who kept some of
// them. A human remembers that ("I passed Deimos Down to him") and plays around it; the AI's
// imagined opponent hands were completely random (gameCopy.ts hideUnknownCards).
// Kept in memory only: after a server restart the AI just forgets, like a new player at the table.

/** Games remembered at most; old ones are dropped first. */
const MAXIMUM_GAMES = 200;

// game id → "viewer id|receiver id" → cards the viewer passed to the receiver
const passedByGame = new Map<string, Map<string, Set<CardName>>>();

export function rememberPassedCards(gameId: string, viewerId: string, receiverId: string, cards: ReadonlyArray<CardName>): void {
  let game = passedByGame.get(gameId);
  if (game === undefined) {
    if (passedByGame.size >= MAXIMUM_GAMES) {
      const oldest = passedByGame.keys().next().value;
      if (oldest !== undefined) {
        passedByGame.delete(oldest);
      }
    }
    game = new Map();
    passedByGame.set(gameId, game);
  }
  const key = `${viewerId}|${receiverId}`;
  const known = game.get(key) ?? new Set<CardName>();
  cards.forEach((card) => known.add(card));
  game.set(key, known);
}

/** Cards the viewer passed to this receiver (they may hold them now). */
export function passedCards(gameId: string, viewerId: string, receiverId: string): ReadonlySet<CardName> {
  return passedByGame.get(gameId)?.get(`${viewerId}|${receiverId}`) ?? new Set();
}
