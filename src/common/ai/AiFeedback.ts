import {Color} from '../Color';

// Ratings of AI decisions in analysis games: shared by the rating dialog, the log and the server store.

export const AI_FEEDBACK_RATINGS = ['flag', 'up', 'down'] as const;
export type AiFeedbackRating = typeof AI_FEEDBACK_RATINGS[number];

export function isAiFeedbackRating(value: unknown): value is AiFeedbackRating {
  return typeof value === 'string' && (AI_FEEDBACK_RATINGS as ReadonlyArray<string>).includes(value);
}

/** Emoji of each rating: the same everywhere (buttons, log, plain-text log). */
export const AI_FEEDBACK_EMOJI: Record<AiFeedbackRating, string> = {
  flag: '⚠️',
  up: '👍',
  down: '👎',
};

/** Ratings that may name a better option (a "good" rating needs none). */
export function canNameBetterOption(rating: AiFeedbackRating | undefined): boolean {
  return rating === 'down' || rating === 'flag';
}

/** Longest comment a rating may carry. */
export const MAX_AI_FEEDBACK_TEXT = 500;

/**
 * Role of the rater towards the AI. Every human player plays against the AI players (no teams in
 * the game); spectators cannot rate yet, the role is reserved for them.
 */
export type AiFeedbackRaterRole = 'opponent' | 'spectator';

/**
 * One line of ai-feedback/<gameId>.jsonl (server only, append-only). Changing a rating appends a new
 * line, taking it back appends one with retracted: true; per decision and rater the last line counts.
 */
export type AiFeedbackRecord = {
  gameId: string,
  /** "<gameId>:<n>": the same id as in decisions/<gameId>.jsonl and on the log line; undefined for lines without an AI decision. */
  decisionId?: string,
  /** Log line the rating was given on (LogMessage.id). */
  messageId: string,
  /** Save before the decision (its game state), otherwise the save at rating time. */
  saveId: number,
  generation: number,
  rater: {playerId: string, color: Color, name: string, role: AiFeedbackRaterRole},
  rating?: AiFeedbackRating,
  text: string,
  /** Option the rater would have chosen: index in the decision's traced options, plus its label as plain text. */
  betterOptionIndex?: number,
  betterOptionLabel?: string,
  /** Card of the better option, if it is a single card (shown translated). */
  betterOptionCard?: string,
  retracted?: true,
  /** Time of the rating (ms since epoch). */
  at: number,
};

/** What the players get: the current ratings, without player ids (they would allow playing another seat). */
export type AiFeedbackEntry = {
  messageId: string,
  decisionId?: string,
  color: Color,
  name: string,
  rating: AiFeedbackRating,
  text: string,
  betterOptionIndex?: number,
  betterOptionLabel?: string,
  betterOptionCard?: string,
  at: number,
};

/** Body of POST api/ai-feedback; rating undefined takes the player's rating of the decision back. */
export type AiFeedbackRequest = {
  messageId: string,
  rating?: AiFeedbackRating,
  text?: string,
  betterOptionIndex?: number,
};
