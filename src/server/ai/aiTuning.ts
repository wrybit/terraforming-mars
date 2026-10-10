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
  /** City spot taken from an opponent: share of a VP per adjacent opponent greenery they can no longer score with an own city there (spaceValue.ts), 0 = off. */
  cityDenialShare: number,
  /** 1: tag requirements expect tags at the rate of that tag in the deck and the own play pace instead of a flat 0.3 per generation (requirementOutlook.ts). */
  tagRateModel: number,
  /** 1: unknown cards in hand worth 2–4 M€ by remaining generations, card-drawing actions by the cards they draw (stateValue.ts). */
  drawCardModel: number,
  /** Generations it takes to fill free spots around a city: future greeneries count fully only with at least this many left (spaceValue.ts, stateValue.ts). */
  boardHorizon: number,
  /** 1: a card held for later is valued with the VP value of that later generation (cardValue.ts laterValue). */
  laterPointValue: number,
  /** 1: the cards in hand are part of the future cards an effect card is measured with (engineValue.ts). */
  handSynergy: number,
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
  /** Card value + weight × 0.1 × two-player BGA draft preference of the game phase (cardPriors.ts draftPrior), 0 = off. */
  draftPriorWeight: number,
  /** M€ added to a corporation's value per % point it wins above the Elo expectation on BGA (two players), 0 = off. */
  corporationPriorWeight: number,
  /** M€ one plant production is worth per generation (stateValue.ts productionPerGeneration); 2 since the start. */
  plantProductionValue: number,
  /** Random future tableaus per card for its "later" value (cardValue.ts); 2 since the start. */
  laterSamples: number,
  /** Award lead uncertainty: share of the award score an opponent may still gain per remaining generation (stateValue.ts). */
  awardSwing: number,
  /** 1: hand cards keep a small value in the expected last generation until Mars is terraformed (no selling them off). */
  keepHandUntilEnd: number,
  /** 1: money in the last generation counts in steps of greeneries it can still buy (stateValue.ts). */
  endgameMoney: number,
  /** Share of a VP per generation an action card that collects its own VP resource is worth (Birds, Tardigrades), 0 = flat action value. */
  accumulatorValue: number,
  /** 1: game copies show the opponents' real hands and the real draw pile (old behaviour, test only – the AI must not peek). */
  peek: number,
  /** Rollouts (rolloutSearch.ts): how many of the best moves are played on to the end of the generation, 0 = off. */
  rolloutCandidates: number,
  /** Time in ms the rollouts of one action may take. */
  rolloutBudget: number,
  /** Rollouts only for moves within this many M€ of the best plain value (clear decisions skip them; 0 = no limit). */
  rolloutMargin: number,
  /** M€ per VP of difference to the average end score of a city on that spot in BGA games (Tharsis, first cities; spaceValue.ts), 0 = off. */
  citySpotPrior: number,
  /** 1: imagined opponent hands prefer the cards passed to them in the draft (draftMemory.ts). */
  draftMemory: number,
  /** 1: buying discounts cards that wait long for global parameters and stops when the hand cannot be paid for (cardSelection.ts). */
  playWindow: number,
  /** 1: award scores are projected with their growth over the last two generations (awardHistory.ts). */
  awardTrend: number,
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
  cityDenialShare: 0,
  tagRateModel: 0,
  drawCardModel: 0,
  // Round 19: boardHorizon6 neutral in AI-vs-AI (-0.2 VP, z -0.3), adopted for the human case: a city
  // next to free land in generation 11 instead of a spot with three greeneries (Jens' game).
  boardHorizon: 6,
  laterPointValue: 0,
  handSynergy: 1,
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
  // Second step after 12 instead of 4 first moves: 1v1 rounds 8+9 +2.6 VP per deal (z +2.8);
  // three players, rounds 11+12 (900 seats): 341 wins for 300 expected (z +2.9).
  secondStepCandidates: 12,
  opponentReplies: 0,
  opponentWeightTwoPlayers: 1,
  cardPriorWeight: 3,
  draftPriorWeight: 0,
  corporationPriorWeight: 0,
  plantProductionValue: 2,
  laterSamples: 2,
  // Adopted on purpose without a measurable AI-vs-AI gain (round 13: +0.6 VP per deal, z +0.7; funded
  // awards 829 → 210 per 200 games, funder wins 81 → 87 %): a human overtook three funded awards
  // (30 VP swing), the AI opponent in batches does not chase awards like that.
  awardSwing: 0.15,
  keepHandUntilEnd: 1,
  endgameMoney: 1,
  accumulatorValue: 0,
  peek: 0,
  // Round 18 (400 mirrored 1v1 games): rollout3 +2.7 VP per deal, z 2.45, 55 % wins – but a test game took
  // 516 s instead of 69 s and human games felt far too slow (Jens, 2026-10-10): off again until cheaper.
  rolloutCandidates: 0,
  rolloutBudget: 4000,
  rolloutMargin: 0,
  // Round 20: citySpots neutral in AI-vs-AI (-0.4 VP, z -0.5), adopted for the human case: the first
  // city went next to Noctis although better standard spots exist (Jens).
  citySpotPrior: 1,
  // Round 21 (1200 mirrored 1v1 games): draftMemory -0.4 VP (z -0.4), adopted: the AI should know what a
  // human remembers (Jens); awardTrend +0.9 (z +1.0), adopted for Daniel's late Banker; handSynergy +1.2
  // (z +1.3, round 20 +0.5), adopted (Martin). playWindow -1.3 and laterPoints -1.4 not adopted.
  draftMemory: 1,
  playWindow: 0,
  awardTrend: 1,
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
  // Draft preferences of ~48 000 two-player BGA games (tests/simulation/analyzeBgaGames.py).
  draftPrior: {draftPriorWeight: 1},
  draftPriorStrong: {draftPriorWeight: 2},
  draftPriorOnly: {draftPriorWeight: 2, cardPriorWeight: 0},
  // Corporation choice: Ecoline +2.7, UNMI −6.6 % points → with 3 M€ per point +8 / −20 M€.
  bgaCorporations: {corporationPriorWeight: 3},
  // Economy next to strong BGA winners (analyzeAiEconomy.py): same M€ production, but half the plant
  // production from generation 9 and 3 more cards in hand.
  plants25: {plantProductionValue: 2.5},
  plants30: {plantProductionValue: 3},
  smallerHand: {handTargetEarly: 7, handTargetLate: 3},
  // Two players: more cards than the 3–5 player baseline (smallerHand lost −3.4 VP per deal, moreCardsAgain +0.9 twice).
  moreCards2: {buyMargin: -5, handTargetEarly: 16, handTargetLate: 6},
  // More thinking for the "hard" level against humans (time per move does not matter there).
  moreSamples: {laterSamples: 5},
  deepSearch: {secondStepCandidates: 12, opponentReplies: 4},
  // Round 8: the gain of deepSearch came from the wider second step (opponentReply alone +0.1).
  search8: {secondStepCandidates: 8},
  search20: {secondStepCandidates: 20},
  deepSearch20: {secondStepCandidates: 20, opponentReplies: 4},
  // Jens vs. hard (2026-10-09, 129 : 114): the AI funded Banker, Miner and Landlord with a lead and lost
  // all three. A lead counts less while generations remain → later funding, defending the lead.
  awardRisk15: {awardSwing: 0.15},
  awardRisk30: {awardSwing: 0.3},
  // Before the fix: hand cards worth nothing in the expected last generation (sold too early).
  sellHandEarly: {keepHandUntilEnd: 0},
  // Before: money in the last generation a flat 0.3 per M€.
  flatEndgameMoney: {endgameMoney: 0},
  // Before 2026-10-09: copies with the opponents' real hands and draw pile (measures what peeking was worth).
  peek: {peek: 1},
  // Rollouts: the best moves played on to the end of the generation by a fast greedy AI.
  rollout3: {rolloutCandidates: 3, rolloutBudget: 4000},
  rollout5: {rolloutCandidates: 5, rolloutBudget: 6000},
  // Jens (2026-10-09): the AI could have taken city spots next to his greeneries.
  cityDenial50: {cityDenialShare: 0.5},
  cityDenial100: {cityDenialShare: 1},
  // Mass Converter (5 science tags) bought in a human game and never played: science is common,
  // Jovian rare; a flat rate for every tag misjudges both.
  tagRate: {tagRateModel: 1},
  // Humans drew 27–34 extra cards per game in two test games (AI Central, Business Network …), the
  // AI 1–4: a drawn card counted 2 M€ and every action card a flat 1.5 M€ per generation.
  drawCards: {drawCardModel: 1},
  // Before round 18: no rollouts.
  noRollout: {rolloutCandidates: 0},
  // Jens (2026-10-09): in generation 11 the AI built a city next to free land instead of a spot with
  // three greeneries and an ocean; free spots only become greeneries if there is time left.
  // Before round 19.
  boardHorizon3: {boardHorizon: 3},
  // Martin: play a card only if it brings something for the next generation; pure VP cards wait for
  // the last generation, when money is worth less. A VP is worth more M€ later in the game.
  laterPoints: {laterPointValue: 1},
  // Martin: synergies first (Viral Enhancers with plant/animal/microbe chains): effect cards are
  // measured with the own hand, not only with random future cards.
  noHandSynergy: {handSynergy: 0},
  // Rollouts made a 2P test game take ~600 s: clear decisions (best move 5 M€ ahead) skip them.
  rolloutGate: {rolloutMargin: 5},
  // Jens: the first city went next to Noctis although better standard spots exist (BGA: D7, G4, C5).
  // Before round 20: no BGA spot prior.
  noCitySpots: {citySpotPrior: 0},
  // Jens: remember the cards seen in the draft, like a human player.
  noDraftMemory: {draftMemory: 0},
  // Strategy guides (rusliksu/tm-tierlist): a bought card needs a play window of 1–3 generations,
  // a big hand without money is frozen capital. Three-player human game: in generation 5, 8 of 11
  // hand cards waited for global parameters.
  playWindow: {playWindow: 1},
  // Daniel (2026-10-10): Banker funded at 19 : 7 in generation 12, lost 22 : 33 – his engine came late.
  noAwardTrend: {awardTrend: 0},
  // Daniel won twice with a late engine while the AI led on TR: end the game sooner (closer was neutral at 1).
  closer2: {closer: 2},
  // handSynergy only acts through engineValue, which needs engineWeight > 0 (round 21 measured noise).
  engine1: {engineWeight: 1},
  // Rollouts at a price human games can bear: 2 moves, 0.6 s, only close decisions.
  rolloutCheap: {rolloutCandidates: 2, rolloutBudget: 600, rolloutMargin: 5},
};

export function isTuningVariant(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(TUNING_VARIANTS, name);
}

// Two-player games (the main use case) can differ from the baseline of 3–5 players; found with the
// mirrored 1v1 rounds (docs/ai/bot-heuristics.md). Variants apply on top of it.
export const TWO_PLAYER_TUNING: Partial<AiTuning> = {};
const BASELINE_TWO_PLAYERS: AiTuning = {...BASELINE_TUNING, ...TWO_PLAYER_TUNING};
// Level "hard" (server games against humans, where a few seconds per move do not matter): the
// widest search measured, on top of the baseline. Batches play "normal" with variants.
export const HARD_LEVEL_TUNING: Partial<AiTuning> = {secondStepCandidates: 20, opponentReplies: 4};
const HARD: AiTuning = {...BASELINE_TUNING, ...HARD_LEVEL_TUNING};
const HARD_TWO_PLAYERS: AiTuning = {...BASELINE_TWO_PLAYERS, ...HARD_LEVEL_TUNING};

// By player id: game copies used for valuation have new player objects with the same ids.
const variantByPlayer = new Map<string, string>();
const tuningCache = new Map<string, AiTuning>();

export function setPlayerTuning(playerId: string, variant: string): void {
  variantByPlayer.set(playerId, variant);
  tuningCache.clear();
}

export function clearPlayerTunings(): void {
  variantByPlayer.clear();
  tuningCache.clear();
}

export function tuningOf(player: IPlayer): AiTuning {
  const twoPlayers = player.game.players.length === 2;
  const variant = variantByPlayer.get(player.id);
  if (variant === undefined) {
    if (player.aiLevel === 'hard') {
      return twoPlayers ? HARD_TWO_PLAYERS : HARD;
    }
    return twoPlayers ? BASELINE_TWO_PLAYERS : BASELINE_TUNING;
  }
  const key = `${variant}|${twoPlayers}`;
  let tuning = tuningCache.get(key);
  if (tuning === undefined) {
    tuning = {...(twoPlayers ? BASELINE_TWO_PLAYERS : BASELINE_TUNING), ...TUNING_VARIANTS[variant]};
    tuningCache.set(key, tuning);
  }
  return tuning;
}
