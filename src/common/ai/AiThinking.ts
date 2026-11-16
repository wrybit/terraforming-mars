import {Color} from '../Color';

// What an AI player is busy with while it decides; the game log shows it as a passing line with a spinner
// (Jens 16 Nov 2026: even two seconds of silence feel long). Shared by the server (ai/aiThinking.ts) and the log.
export type AiActivity = 'thinking' | 'pondering' | 'cards' | 'building' | 'playing';

export type AiThinkingModel = {color: Color, activity: AiActivity};

/** Log text per activity (English key, translated; ${0} = the player's name) */
export const AI_ACTIVITY_TEXT: Record<AiActivity, string> = {
  thinking: '${0} is thinking…',
  pondering: '${0} is pondering…',
  cards: '${0} is choosing a card…',
  building: '${0} is building something…',
  playing: '${0} is playing…',
};
