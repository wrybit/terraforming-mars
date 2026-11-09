import {Color} from '../Color';
import {AI_LEVELS, AiLevel, aiMarkerOf, aiPlayerMarker} from './AiLevel';

// AI players get random names: in the player list of the admin page every AI of one strength counts as
// one account, so the list stays readable. Fixed colours per strength, independent of the seat colour.

export type BotAccount = {level: AiLevel, name: string, color: Color};

const BOT_COLORS: Record<AiLevel, Color> = {easy: 'yellow', normal: 'orange', hard: 'red'};

/** "Bot [AI-]" (yellow), "Bot [AI]" (orange), "Bot [AI+]" (red). */
export const BOT_ACCOUNTS: ReadonlyArray<BotAccount> = AI_LEVELS.map((level) => ({level, name: `Bot ${aiPlayerMarker(level)}`, color: BOT_COLORS[level]}));

/** The account an AI player's name counts as, undefined for human players. Old markers ("(AI)") count as "[AI]". */
export function botAccountOf(displayName: string): BotAccount | undefined {
  const marker = aiMarkerOf(displayName);
  return marker === undefined ? undefined : BOT_ACCOUNTS.find((account) => aiPlayerMarker(account.level) === marker);
}
