import {Color} from '../Color';

// Ratings of AI decisions in analysis games: shared by the rating dialog, the log and the server store.

export const AI_FEEDBACK_RATINGS = ['flag', 'up', 'down'] as const;
export type AiFeedbackRating = typeof AI_FEEDBACK_RATINGS[number];

export function isAiFeedbackRating(value: unknown): value is AiFeedbackRating {
  return typeof value === 'string' && (AI_FEEDBACK_RATINGS as ReadonlyArray<string>).includes(value);
}

/** Emoji of each rating: the same everywhere (buttons, log, plain-text log). */
export const AI_FEEDBACK_EMOJI: Record<AiFeedbackRating, string> = {
  flag: '🚩',
  up: '👍',
  down: '👎',
};

/** Longest comment a rating may carry. */
export const MAX_AI_FEEDBACK_TEXT = 500;

/** One player's rating of one log line (each player has at most one per line). */
export type AiFeedbackEntry = {
  /** Log line (LogMessage.id). */
  messageId: string,
  /** AI decision behind the line, if known (links to the decision log file). */
  decisionId?: string,
  /** Player who rated. */
  color: Color,
  name: string,
  rating: AiFeedbackRating,
  text: string,
  /** Time of the rating (ms since epoch). */
  at: number,
};

/** Body of POST api/ai-feedback; rating undefined removes the player's rating of the line. */
export type AiFeedbackRequest = {
  messageId: string,
  rating?: AiFeedbackRating,
  text?: string,
};
