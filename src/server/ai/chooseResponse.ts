import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {InputResponse} from '../../common/inputs/InputResponse';
import {SelectInitialCards} from '../inputs/SelectInitialCards';
import {SelectCard} from '../inputs/SelectCard';
import {Phase} from '../../common/Phase';
import {AiLevel} from '../../common/ai/AiLevel';
import {chooseAction} from './actionLookahead';
import {chooseCardsToKeep, chooseInitialCards} from './cardSelection';
import {isActionMenu} from './gameCopy';
import {quickResponse} from './quickResponse';
import {randomResponse} from './randomResponse';

// Entry point of the rule-based AI (stage 1): which answer to give for the current input.

type LevelProfile = {
  /** Misjudgement in M€ added to every value in the action lookahead. */
  noise: number,
  /** Share of decisions taken completely at random. */
  randomShare: number,
};

const LEVEL_PROFILES: Record<AiLevel, LevelProfile> = {
  easy: {noise: 12, randomShare: 0.15},
  // Small noise only: larger noise turned slightly bad moves (selling a card) into favourites.
  normal: {noise: 1, randomShare: 0},
  hard: {noise: 0, randomShare: 0},
};

const CARD_CHOICE_PHASES: ReadonlyArray<Phase> = [Phase.RESEARCH, Phase.DRAFTING, Phase.INITIALDRAFTING];

export function chooseResponse(input: PlayerInput, player: IPlayer, level: AiLevel): InputResponse {
  const profile = LEVEL_PROFILES[level];
  if (profile.randomShare > 0 && Math.random() < profile.randomShare) {
    return randomResponse(input, player, Math.random);
  }
  if (input instanceof SelectInitialCards) {
    return chooseInitialCards(input, player);
  }
  if (isActionMenu(input)) {
    const response = chooseAction(input, player, {noise: profile.noise});
    if (response !== undefined) {
      return response;
    }
  }
  if (input instanceof SelectCard && CARD_CHOICE_PHASES.includes(player.game.phase)) {
    return chooseCardsToKeep(input, player);
  }
  return quickResponse(input, player);
}
