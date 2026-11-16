import {Color} from '../Color';

/** What an AI seat is busy with: decides which texts the log's passing line picks from. */
export type AiActivity = 'thinking' | 'cards' | 'building';

/**
 * Texts of the passing log line, "${0}" is the player. No trailing dots: the line animates them.
 * The server picks one at random per decision, so every viewer reads the same text.
 */
export const AI_THINKING_TEXTS: Record<AiActivity, ReadonlyArray<string>> = {
  thinking: [
    '${0} is thinking',
    '${0} is pondering',
    '${0} is weighing the options',
    '${0} is doing the math',
    '${0} is forging a plan',
    '${0} is studying the board',
    '${0} is calculating',
    '${0} is consulting the stars',
    '${0} is plotting',
  ],
  cards: [
    '${0} is choosing a card',
    '${0} is sorting the cards',
    '${0} is reading the fine print',
  ],
  building: [
    '${0} is building something',
    '${0} is looking for a good spot',
    '${0} is surveying Mars',
  ],
};

export type AiThinkingModel = {
  color: Color,
  /** One of AI_THINKING_TEXTS */
  text: string,
  /** Thinking time left when the server answered (the client counts down from its own receipt time) */
  remainingMs: number,
};
