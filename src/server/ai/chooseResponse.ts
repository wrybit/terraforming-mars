import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {InputResponse} from '../../common/inputs/InputResponse';
import {SelectInitialCards} from '../inputs/SelectInitialCards';
import {SelectCard} from '../inputs/SelectCard';
import {Phase} from '../../common/Phase';
import {AiLevel} from '../../common/ai/AiLevel';
import {chooseAction} from './actionLookahead';
import {chooseCardsToDiscard, chooseCardsToKeep, chooseFreeCardsToKeep, chooseInitialCards} from './cardSelection';
import {isActionMenu} from './gameCopy';
import {KEEP_TITLE, quickResponse, titleOf} from './quickResponse';
import {randomResponse} from './randomResponse';
import {recordDecision} from './decisionTrace';
import {describeResponse} from './decisionLabels';
import {recordAwardScores} from './awardHistory';
import {isSimulating} from './simulationSandbox';
import {OrOptions} from '../inputs/OrOptions';
import {WORLD_GOVERNMENT_TITLE, chooseWorldGovernment} from './worldGovernmentChoice';
import {tuningOf} from './aiTuning';
import {chooseBazaarWare, chooseWormDistance} from './duneChoices';
import {BAZAAR_TITLE} from '../dune/Bazaar';
import {WORM_TITLE} from '../dune/Worm';
import {clearFollowUpPlan, plannedFollowUp} from './followUpPlan';

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
  // With 1 M€ the decision traces showed 11 % of all moves were not the best-valued one.
  normal: {noise: 0.5, randomShare: 0},
  hard: {noise: 0, randomShare: 0},
};

const CARD_CHOICE_PHASES: ReadonlyArray<Phase> = [Phase.RESEARCH, Phase.DRAFTING, Phase.INITIALDRAFTING];

export function chooseResponse(input: PlayerInput, player: IPlayer, level: AiLevel): InputResponse {
  // In AI test batches every decision is recorded with its options (decisionTrace.ts).
  return recordDecision(input, player, () => decide(input, player, level), (response) => describeResponse(input, response, player.game));
}

function decide(input: PlayerInput, player: IPlayer, level: AiLevel): InputResponse {
  // Award scores per generation for the trend (awardHistory.ts), only from the real game.
  if (!isSimulating()) {
    recordAwardScores(player.game);
  }
  // A follow-up plan belongs to one move: a new action menu drops it (chooseAction sets a new one).
  if (!isSimulating()) {
    if (isActionMenu(input)) {
      clearFollowUpPlan(player);
    } else if (player.game.phase === Phase.ACTION) {
      const planned = plannedFollowUp(input, player);
      if (planned !== undefined) {
        return planned;
      }
    }
  }
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
  // World Government terraforming (Venus Next): each option tried on a game copy (worldGovernmentChoice.ts).
  if (input instanceof OrOptions && input.title === WORLD_GOVERNMENT_TITLE && tuningOf(player).worldGovernment > 0 && !isSimulating()) {
    const response = chooseWorldGovernment(input, player);
    if (response !== undefined) {
      return response;
    }
  }
  // Dune expansion: buying at the bazaar of Arrakeen, each ware tried on a game copy (duneChoices.ts)
  if (input instanceof OrOptions && input.title === BAZAAR_TITLE && !isSimulating()) {
    const response = chooseBazaarWare(input, player);
    if (response !== undefined) {
      return response;
    }
  }
  // Dune expansion: how far the worm moves (the weakest player decides)
  if (input instanceof OrOptions && input.title === WORM_TITLE && !isSimulating()) {
    const response = chooseWormDistance(input, player);
    if (response !== undefined) {
      return response;
    }
  }
  if (input instanceof SelectCard && CARD_CHOICE_PHASES.includes(player.game.phase)) {
    return chooseCardsToKeep(input, player);
  }
  // Drawn cards to keep in the action phase (Business Contacts, Invention Contest …): the full card valuation
  // instead of the quick statistics order. Not inside simulations (rare choice, timing estimate is costly there).
  if (input instanceof SelectCard && titleOf(input) === KEEP_TITLE && tuningOf(player).keepValuation > 0 && !isSimulating()) {
    return chooseFreeCardsToKeep(input, player);
  }
  // Cards to discard (Mars University …): the least valuable, not the quick rule's order (which keeps VP cards first).
  if (input instanceof SelectCard && titleOf(input).includes('discard') && tuningOf(player).discardValuation > 0 && !isSimulating()) {
    return chooseCardsToDiscard(input, player);
  }
  return quickResponse(input, player);
}
