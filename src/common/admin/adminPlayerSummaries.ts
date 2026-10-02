import {Color} from '../Color';
import {AdminPlayerSummary} from './AdminGameSummary';
import {findWinnerIndexes} from './findWinners';

export type AdminPlayerScore = {
  name: string;
  color: Color;
  url: string | undefined;
  victoryPoints: number;
  megaCredits: number;
  corporation: string | undefined;
};

/**
 * Builds the player rows including the winner marker.
 * Winners exist only in finished games; solo you only win if the solo goal was reached.
 */
export function toAdminPlayerSummaries(scores: ReadonlyArray<AdminPlayerScore>, isFinished: boolean, isSoloModeWin: boolean): Array<AdminPlayerSummary> {
  const isSolo = scores.length === 1;
  const winnerIndexes = !isFinished ? [] : isSolo ? (isSoloModeWin ? [0] : []) : findWinnerIndexes(scores);
  return scores.map((score, index) => ({...score, isWinner: winnerIndexes.includes(index)}));
}
