import {IPlayer} from '../IPlayer';

// Adjustable AI parameters, so that two variants can play against each other in the same test
// game (A/B seats in tests/simulation/runAiBatch.ts). The server always plays the baseline.

export type AiTuning = {
  /** A card is bought when its value exceeds price + margin (M€). */
  buyMargin: number,
  /** Hand size the AI fills up to while more than 3 generations are left / at the end. */
  handTargetEarly: number,
  handTargetLate: number,
  /** Money kept back after buying cards while more than 3 generations are left. */
  researchReserveEarly: number,
  /** City placement: VP per other own / opponent city at a free spot next to the new city (spaceValue.ts). */
  sharedSpotShare: number,
  opponentSpotShare: number,
  /** Weight of the measured engine value of effect cards (engineValue.ts), 0 = off. */
  engineWeight: number,
  /** 1: cards with a maximum requirement lose value for later when the window is closing. */
  closingWindow: number,
  /** Share of a hand card's value a card gets when its tags make that card playable. */
  enablerWeight: number,
  /** Early in the game, cards only worth playing later are bought at this share of their value. */
  lateBuyFactor: number,
  /** Draft: share of a card's value for the player who receives the rest (hate draft), 0 = off. */
  draftDenial: number,
  /** 1: raising global parameters shortens the game in the valuation (stateValue.ts contextFor). */
  tempoAware: number,
  /** Weight of the race term: raising steps is good when the strongest rival's engine grows faster (stateValue.ts closerTerm). */
  closer: number,
  /** M€ a global step raised by anybody costs in the valuation: > 0 keeps the game long (engine builder opponent). */
  terraformBrake: number,
  /** 1: expected game length by player count (2 players 15, 3 players 12) instead of 12 (gameProgress.ts). */
  lengthByPlayers: number,
  /** Factor on the M€ value of a victory point in the deciding player's valuation (stateValue.ts). */
  victoryPointScale: number,
  /** Passing with money left costs this share of it (up to 40 M€) in the move choice (actionLookahead.ts). */
  passPenalty: number,
  /** Share of future income (production, TR) counted now; 0.55 since the start (stateValue.ts). */
  productionDiscount: number,
  /** 1: remaining generations from the fitted terraforming curve (gameProgress.ts curvedRemaining). */
  lengthModel: number,
  /** 1: award leads projected to the game end by each player's pace (stateValue.ts projectedAwardScore). */
  awardTiming: number,
  /** Action phase: how many of the best first moves get a second action tried after them. */
  secondStepCandidates: number,
  /** Action phase: how many of the best moves are checked against the next opponent's best reply (0 = off). */
  opponentReplies: number,
  /** Weight of the opponent's position in a two-player game (more players: 0.5). */
  opponentWeightTwoPlayers: number,
  /** Card value × (1 + weight × BGA prior) (cardPriors.ts); 0 = no prior. */
  cardPriorWeight: number,
  /** Share of a VP per generation an action card that collects its own VP resource is worth (Birds, Tardigrades), 0 = flat action value. */
  accumulatorValue: number,
};

// Card buying, found with A/B batches (same 100 deals, variants rotating through the seats):
// - before: margin 1.5, hand 6/3, reserve 4 – ~23 cards played per game (a human: 54);
// - margin -1, hand 9/4, reserve 0 won 58 of 130 seats against 43 (+2.8 VP);
// - margin -3, hand 12/5 won 55 against 50 (+2.2 VP, 35 cards played).
export const BASELINE_TUNING: AiTuning = {
  // Night runs E+F: with production valued at 0.9, fewer cards win (z +4.75, +3.60): -1 and 9/4.
  buyMargin: -1,
  handTargetEarly: 9,
  handTargetLate: 4,
  researchReserveEarly: 0,
  sharedSpotShare: 0.4,
  opponentSpotShare: 0.25,
  // A/B: weight 1 (clipped at 0) lost 45 : 58, weight 0.5 won 58 : 43 in 100 games but 153 : 158
  // in 300 new games (z +0.3 vs +0.8) – no clear gain, so off again (it costs computing time).
  engineWeight: 0,
  closingWindow: 0,
  enablerWeight: 0,
  lateBuyFactor: 1,
  // A/B 2026-10-08: hate draft won clearly (z +1.83 over 800 games in two batches),
  // full opponent weight in two-player games too (2P: z +2.01 in 400 games).
  draftDenial: 0.5,
  tempoAware: 0,
  closer: 0,
  terraformBrake: 0,
  // Neutral in AI-vs-AI (z +0.36) but measured right (2P 14.5, 3P 11.8 generations); adopted on
  // purpose against the z rule: with 12 the AI gave up its engine from generation 8 against a human.
  lengthByPlayers: 1,
  awardTiming: 0,
  // Night runs A+B (3200 games): 0.55 → 0.9 won clearly (A: 0.75 z +4.8; B: 0.9 z +2.7, 1.05 z +3.5,
  // control −0.8); best VP per generation. Income was undervalued once the game length was right.
  productionDiscount: 0.9,
  // Night runs C+D: pass penalty 0.25 z +2.9 / +1.3, 0.4 z +3.1 (2P +2 VP), 0.1 neutral → 0.3.
  passPenalty: 0.3,
  victoryPointScale: 1,
  // Fitted terraforming curve (gameProgress.ts curvedRemaining): estimate error 2P 1.86 → 1.25,
  // 3P 1.45 → 0.80, human games 1.96 → 0.75 generations; neutral in AI-vs-AI (z −0.17).
  lengthModel: 1,
  secondStepCandidates: 4,
  opponentReplies: 0,
  opponentWeightTwoPlayers: 1,
  cardPriorWeight: 3,
  accumulatorValue: 0,
};

// Champion/challenger: a change only becomes the baseline when it wins clearly more seats than
// expected (z ≥ 1.64 in tests/simulation/compareVariants.py); 100 games are often not enough.
export const TUNING_VARIANTS: Record<string, Partial<AiTuning>> = {
  baseline: {},
  // Identical copy of the baseline: shows how far two equal AIs drift apart by chance (A/A test).
  control: {},
  // Night of 2026-10-08: with a correct game length, is income worth more? And more cards.
  production65: {productionDiscount: 0.65},
  production75: {productionDiscount: 0.75},
  production90: {productionDiscount: 0.9},
  production105: {productionDiscount: 1.05},
  production55: {productionDiscount: 0.55},
  stayIn: {passPenalty: 0.1},
  stayInStrong: {passPenalty: 0.25},
  stayInMax: {passPenalty: 0.4},
  victoryPoints125: {victoryPointScale: 1.25},
  victoryPoints80: {victoryPointScale: 0.8},
  fewerCardsStayInMax: {buyMargin: -1, handTargetEarly: 9, handTargetLate: 4, passPenalty: 0.4},
  // Previous card buying (margin -3, hand 12/5) and one step further down.
  moreCardsAgain: {buyMargin: -3, handTargetEarly: 12, handTargetLate: 5},
  fewestCards: {buyMargin: 0, handTargetEarly: 7, handTargetLate: 3},
  moreCards: {buyMargin: -5, handTargetEarly: 16, handTargetLate: 6},
  // Baseline before the hate draft and the zero-sum two-player valuation, to confirm both.
  previous: {draftDenial: 0, opponentWeightTwoPlayers: 0.5},
  // Earlier baselines, to re-check adopted changes with more games:
  engine: {engineWeight: 0.5},
  fewerCards: {buyMargin: -1, handTargetEarly: 9, handTargetLate: 4},
  // Card timing as the group plays it: closing windows, enabler cards, late cards bought later.
  cardTiming: {closingWindow: 1, enablerWeight: 0.5, lateBuyFactor: 0.6},
  // Draft: also take away what the next player would like (standard variant of the group).
  hateDraft: {draftDenial: 0.5},
  // From a human game: the AI led until generation 12 but let the game run on; the human's engine won.
  // A/B: lost clearly (z -1.81) – raising parameters for the shorter game costs too much.
  tempo: {tempoAware: 1},
  zeroSumTwoPlayers: {opponentWeightTwoPlayers: 1},
  // Tempo done right: end the game when the rival's engine grows faster, drag it out otherwise.
  closer: {closer: 1},
  // Sparring partner modelled on a human who won 198 : 93: buys many cards, keeps terraforming slow
  // and builds a big engine. Not a candidate for the baseline – it shows whether 'closer' punishes it.
  // From a human game (209 : 108, 16 generations): game length by player count, award timing.
  realLength: {lengthByPlayers: 1},
  curvedLength: {lengthModel: 1},
  // Before realLength: fixed 12 generations (calibration says it estimated 2P better than 15 on a straight line).
  fixedLength: {lengthByPlayers: 0},
  awardTiming: {awardTiming: 1},
  // Deeper search: second action after more first moves; the next opponent's best reply.
  widerSearch: {secondStepCandidates: 12},
  opponentReply: {opponentReplies: 4},
  engineBuilder: {buyMargin: -6, handTargetEarly: 16, handTargetLate: 6, terraformBrake: 6},
  // 1v1 rounds (2026-10-09, mirrored deals, compareHeadToHead.py): does the BGA card prior help,
  // and are VP collectors (Birds, Fish, Tardigrades …) undervalued? Martin scored big with them.
  noPrior: {cardPriorWeight: 0},
  strongPrior: {cardPriorWeight: 6},
  collectors: {accumulatorValue: 0.8},
};

export function isTuningVariant(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(TUNING_VARIANTS, name);
}

// By player id: game copies used for valuation have new player objects with the same ids.
const tuningByPlayer = new Map<string, AiTuning>();

export function setPlayerTuning(playerId: string, variant: string): void {
  tuningByPlayer.set(playerId, {...BASELINE_TUNING, ...TUNING_VARIANTS[variant]});
}

export function clearPlayerTunings(): void {
  tuningByPlayer.clear();
}

export function tuningOf(player: IPlayer): AiTuning {
  return tuningByPlayer.get(player.id) ?? BASELINE_TUNING;
}
