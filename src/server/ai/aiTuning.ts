import {IPlayer} from '../IPlayer';

// Adjustable AI parameters, so that two variants can play against each other in the same test
// game (A/B seats in AI test batches). The server always plays the baseline.

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
  /** 1: unknown cards in hand worth 2–4 M€ by remaining generations, card-drawing actions by the cards they draw (stateValue.ts); 2: also tag-triggered draws as income (cardIncome.ts). */
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
  /** Rollout policy: moves tried per decision inside a rollout, 0 = quick rules without game copies (actionLookahead.ts). */
  rolloutPolicyMoves: number,
  /** Rollouts stop after this many action choices and value the position, 0 = play to the end of the generation. */
  rolloutHorizon: number,
  /** 1: rollouts only for key decisions – a pass, a milestone or award among the finalists, or the last two generations. */
  rolloutFocus: number,
  /** Rounds of rollouts per decision at most (one rollout per finalist and round, common random numbers). */
  rolloutMaximumRounds: number,
  /** Rollout policy for the opponents, -1 = same as rolloutPolicyMoves (0 = quick rules, much cheaper). */
  rolloutOpponentPolicyMoves: number,
  /** 1: in the last generation the greeneries the opponents can still afford on the free land count against the AI (lastGenerationSpots.ts). */
  lastGenerationSpots: number,
  /** 1: in the last generation money left after passing is worth nothing (stateValue.ts lastGenerationMoneyValue). */
  passedMoneyLost: number,
  /** Weight of the VP that per-tag cards (1 VP per Jovian tag …) still gain from tags in hand and the own pace (tagPointOutlook.ts), 0 = off. */
  tagPointOutlook: number,
  /** Share of a milestone's 5 VP that full progress towards it is worth before the claim (milestoneRace.ts). */
  milestoneProgressShare: number,
  /** M€ one energy production is worth per generation (stateValue.ts productionPerGeneration); 1.1 since the start. */
  energyProductionValue: number,
  /** Weight of the trigger gain a card gives up when played before a playable effect card it would trigger (triggerOrder.ts), 0 = off. */
  triggerOrderPenalty: number,
  /** Weight of the trigger gain an effect card brings for the cards in hand (triggerOrder.ts), 0 = off. */
  triggerOrderBonus: number,
  /** Before the last generation the AI may sell its cheapest cards for a claim (sellToAfford.ts): 1 milestones, 2 also awards. */
  sellToAfford: number,
  /** 1: in the research phase the AI buys up to 3 extra cards when they make a milestone claimable (milestoneBuying.ts). */
  buyForMilestone: number,
  /** 1: in the last generation the AI keeps the cards that bring the most points with the sale money and sells the rest (lastGenerationSale.ts). */
  lastGenerationSale: number,
  /** 1: before the first own city the first tiles go into a planned home cluster: one city, two greeneries (openingPlan.ts). */
  openingPlan: number,
  /** Generations the observed terraforming speed may move the game-length estimate from the prior (gameProgress.ts). */
  lengthDeviation: number,
  /** Share of a city's free neighbours expected to become greeneries (boardPotential.ts); more = more appetite for cities. */
  cityNeighbourShare: number,
  /** Chance an opponent builds a city next to a lonely own greenery (boardPotential.ts). */
  exposedSpotRisk: number,
  /** Award lead uncertainty from actions still open this generation: per 10 M€ of the richest player who has not passed (stateValue.ts). */
  awardActionSwing: number,
  /** Card value × (1 + weight × fit to the flow of the own game), fit learned from top players' tableaus (cardFit.ts); 0 = off. */
  flowFit: number,
  /** M€ per card seen but not kept when choosing from several drawn cards (drawChoice.ts); 0 = off. */
  drawChoiceValue: number,
  /** 1: cards whose action spends energy are valued by how much of it the energy production can supply (energySupply.ts). */
  energySupply: number,
  /** Steps before a milestone within which its claim already counts (milestoneRace.ts nearClaimPoints); 0 = off. */
  milestoneNear: number,
  /** Weight for keeping greeneries in a ring around an own city (greeneryRing.ts), in VP; 0 = off. */
  greeneryRing: number,
  /** Share of the money-driven award swing for awards that count a resource stock (stockAward.ts); 1 = as for all awards. */
  stockAwardSwing: number,
  /** Fixed value a pass gives up against any other move (actionLookahead.ts passPenaltyFor); 0 = off. */
  passLastResort: number,
  /** Weight of global-parameter bonus steps a move leaves open for an opponent (bonusRace.ts); 0 = off. */
  bonusRace: number,
  /** Exponent of the income ratio to the rival that scales the research hand target (handPlan.ts); 0 = off. */
  planHand: number,
  /** M€ a turn ended after one action is worth: the rest can still be done later, after seeing the reply (0 = off). */
  turnTempo: number,
  /** Share of plants and animals counted as lost to opponents' attack cards (attackExposure.ts); 0 = off. */
  exposure: number,
  /** Draft denial grows with game progress: factor 1 + lateDenial × (progress − 0.5); 0 = constant. */
  lateDenial: number,
  /** 1: collector cards gain their measured resources per generation (collectorRate.ts) instead of one. */
  collectorRates: number,
  /** Generations by which the pace of the last generation may shorten the expected game length (recentPace.ts); 0 = off. */
  recentPace: number,
  /** 1: World Government terraforming options are tried on game copies (worldGovernmentChoice.ts); 0 = first option. */
  worldGovernment: number,
  /** 1: OR questions right after a move are tried once per option on game copies (followUpPlan.ts); 0 = first option. */
  followUpChoice: number,
  /** 1: OR questions also with single-card choices (copy targets, card to take) are tried on copies; 0 = quick rule. */
  followUpCards: number,
  /** 1: energy production counts as energy only up to what actions and hand cards use, the rest as heat (energyPlan.ts). */
  energyPlan: number,
  /** 1: "choose X" follow-ups (also inside OR questions) are tried with the smallest, middle and largest X (followUpPlan.ts). */
  followUpAmounts: number,
  /** 1: leftover energy is worth nothing once the temperature is maxed or no production phase is left (stateValue.ts). */
  energyAsHeat: number,
  /** 1: in the likely last generation steel and titanium a close funded stock award counts are paid last (awardStockPayment.ts). */
  keepAwardStock: number,
  /** > 0: award funding only with a lead of at least this share of the best opponent score (awardFunding.ts). */
  awardFundingLead: number,
  /**
   * Share of the learned position value (bgaValueModel.ts, two-player games only) in the valuation: 0 = hand-made
   * valuation only, 1 = model only. The model's expected final VP margin is priced like VP now (stateValue.ts).
   */
  valueModel: number,
  /**
   * Factor on valueModel in the opening (generations 1–4): the learned model prices M€ production there far below
   * the hand-made valuation (0.6 VP per unit), so the AI may neglect income early. 1 = same share as later.
   */
  valueModelOpening: number,
  /**
   * Factor on the value of production (not TR) up to generation 6, fading to 1 by generation 10 (stateValue.ts):
   * human winners build income and cards first and terraform later; the AI rushed TR and lost by 60–70 VP.
   */
  incomeWeight: number,
  /** 1: drawn cards kept for free in the action phase (Business Contacts …) chosen by the full card valuation (cardSelection.ts). */
  keepValuation: number,
  /** 1: cards to discard from hand chosen as the least valuable by the full card valuation (cardSelection.ts). */
  discardValuation: number,
  /** > 0: this share of the tags of own hand cards counts for tag awards (Scientist …), see awardHandOutlook.ts. */
  awardHandOutlook: number,
  /** 1: cards counting city tiles (Greenhouses) are valued at the end of the game with the cities built by then (cardValue.ts). */
  lateBoardCards: number,
};

// Card buying, found with A/B batches (same 100 deals, variants rotating through the seats):
// - before: margin 1.5, hand 6/3, reserve 4 – ~23 cards played per game (a human: 54);
// - margin -1, hand 9/4, reserve 0 won 58 of 130 seats against 43 (+2.8 VP);
// - margin -3, hand 12/5 won 55 against 50 (+2.2 VP, 35 cards played).
export const BASELINE_TUNING: AiTuning = {
  // Night runs E+F: with production valued at 0.9, fewer cards win (z +4.75, +3.60): -1 and 9/4.
  // Round 30 (bundle1, 600 mirrored deals): margin -3 and hand 12/5 together with productionDiscount
  // 1.05 and 16 second-step candidates +1.30 VP per deal (z +3.09) – each part alone was only slightly positive.
  buyMargin: -3,
  handTargetEarly: 12,
  handTargetLate: 5,
  researchReserveEarly: 0,
  sharedSpotShare: 0.4,
  opponentSpotShare: 0.25,
  cityDenialShare: 0,
  tagRateModel: 0,
  // Round 44: cardIncome +0.38 VP per deal (z +0.48) and adopted; round 45 (with flowFit 2): noCardIncome +1.45
  // (z +1.60) – pooled negative, back to 0.
  drawCardModel: 0,
  // Round 19: boardHorizon6 neutral in AI-vs-AI (-0.2 VP, z -0.3), adopted for the human case: a city
  // next to free land in generation 11 instead of a spot with three greeneries (human test game).
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
  // Round 49 (1200 mirrored 1v1 games): closer +1.37 VP per deal (z +1.69) – end the game sooner when the rival's
  // engine is stronger (human economy players kept terraforming slow) – adopted. Round 51: closer 0.5 +1.45 (z +1.86)
  // against 1 – lowered.
  closer: 0.5,
  terraformBrake: 0,
  // Neutral in AI-vs-AI (z +0.36) but measured right (2P 14.5, 3P 11.8 generations); adopted on
  // purpose against the z rule: with 12 the AI gave up its engine from generation 8 against a human.
  lengthByPlayers: 1,
  awardTiming: 0,
  // Night runs A+B (3200 games): 0.55 → 0.9 won clearly (A: 0.75 z +4.8; B: 0.9 z +2.7, 1.05 z +3.5,
  // control −0.8); best VP per generation. Income was undervalued once the game length was right.
  productionDiscount: 1.05,
  // Night runs C+D: pass penalty 0.25 z +2.9 / +1.3, 0.4 z +3.1 (2P +2 VP), 0.1 neutral → 0.3.
  passPenalty: 0.3,
  victoryPointScale: 1,
  // Fitted terraforming curve (gameProgress.ts curvedRemaining): estimate error 2P 1.86 → 1.25,
  // 3P 1.45 → 0.80, human games 1.96 → 0.75 generations; neutral in AI-vs-AI (z −0.17).
  lengthModel: 1,
  // Second step after 12 instead of 4 first moves: 1v1 rounds 8+9 +2.6 VP per deal (z +2.8);
  // three players, rounds 11+12 (900 seats): 341 wins for 300 expected (z +2.9).
  secondStepCandidates: 16,
  opponentReplies: 0,
  opponentWeightTwoPlayers: 1,
  // Round 36 (bundle2, 600 mirrored deals): cardPriorWeight 2 with awardSwing 0.3 +1.96 VP (z +4.73).
  cardPriorWeight: 2,
  draftPriorWeight: 0,
  corporationPriorWeight: 0,
  plantProductionValue: 2,
  laterSamples: 2,
  // Adopted on purpose without a measurable AI-vs-AI gain (round 13: +0.6 VP per deal, z +0.7; funded
  // awards 829 → 210 per 200 games, funder wins 81 → 87 %): a human overtook three funded awards
  // (30 VP swing), the AI opponent in batches does not chase awards like that.
  awardSwing: 0.3,
  keepHandUntilEnd: 1,
  endgameMoney: 1,
  // Round 66: 0.6 together with the measured collector rates (collectorRates).
  // Rounds 67–69: collectorRate04 +0.43/+0.91/+0.37 (pooled z ≈ 1.33) – lowered to 0.4.
  accumulatorValue: 0.4,
  peek: 0,
  // Round 18 (400 mirrored 1v1 games): rollout3 +2.7 VP per deal, z 2.45, 55 % wins – but a test game took
  // 516 s instead of 69 s and human games felt far too slow (human feedback, 2026-10-10): off again until cheaper.
  // Round 79 (faster engine, at most 3 rounds per rollout): rollout3Rounds +1.52 VP (z +2.28) for +20 s per
  // test game – above the bar of 1 VP per 15 s, adopted.
  // Round 80: rollout3Lean (quick rules for the opponents) −0.31 VP (z −0.45) but ~18 s less per AI player and
  // game – the full opponent policy does not pay for its time (1 VP per 15 s), lean adopted.
  rolloutCandidates: 3,
  rolloutBudget: 2000,
  rolloutMargin: 0,
  // Round 20: citySpots neutral in AI-vs-AI (-0.4 VP, z -0.5), adopted for the human case: the first
  // city went next to Noctis although better standard spots exist (human test game).
  citySpotPrior: 1,
  // Round 21 (1200 mirrored 1v1 games): draftMemory -0.4 VP (z -0.4), adopted: the AI should know what a
  // human remembers; awardTrend +0.9 (z +1.0), adopted for a human's late Banker; handSynergy +1.2
  // (z +1.3, round 20 +0.5), adopted (human feedback). playWindow -1.3 and laterPoints -1.4 not adopted.
  draftMemory: 1,
  playWindow: 0,
  awardTrend: 1,
  rolloutPolicyMoves: 8,
  rolloutHorizon: 0,
  rolloutFocus: 0,
  rolloutMaximumRounds: 3,
  rolloutOpponentPolicyMoves: 0,
  // Round 88: keepAwardStock (only a lead, only the units that would lose it) +0.47 VP (z +0.74), fixes a
  // human-game error (Miner lost 9 : 10 by paying with steel, game lost 103 : 105) – adopted.
  keepAwardStock: 1,
  // Round 91 (1200 mirrored 1v1 games): valueModel25 +3.48 VP (z +4.81; base +2.80, venus +4.16), Mac 85 s vs 70 s
  // (+15 s for +3.5 VP) – adopted; valueModel50 −3.58 (z −3.81): more model than that hurts.
  valueModel: 0.25,
  valueModelOpening: 1,
  incomeWeight: 1,
  // Round 91: keepValued +1.06 VP (z +1.63) – adopted, fixes the analysis-log error (Business Contacts by statistics).
  keepValuation: 1,
  // Rated human game (2026-10-16): Mars University discarded Birds; Jens' discard order is a rule (discardPriority.ts).
  discardValuation: 1,
  // Round 92: awardHand −0.25 VP (z −0.32) – adopted as human-game fix (Scientist funded early with science cards in hand).
  awardHandOutlook: 0.7,
  // Jens (2026-10-16): Greenhouses is always taken and played as late as possible – a rule, no test round needed.
  lateBoardCards: 1,
  lastGenerationSpots: 0,
  // Human test game (2026-10-10): passed in the last generation with 47 M€ while greeneries were affordable.
  passedMoneyLost: 1,
  // Round 27 (1200 mirrored 1v1 games): tagOutlook60 −0.07 VP (z −0.09), adopted for the human case:
  // a human scored 7–8 VP with each Jovian per-tag card while the AI valued them with today's tags.
  tagPointOutlook: 0.6,
  // Rounds 29 + 31 (milestoneRace30): +0.81 VP each, pooled z +1.58 – chasing milestones costs the engine.
  // Round 33: milestone0 +2.36 VP (z +3.06) – progress before the claim counts nothing; claiming stays valued.
  milestoneProgressShare: 0,
  // Round 89 (with rollouts): energy09 +1.29 VP (z +1.78) – adopted; human game: Space Mirrors bought at M€ production 0.
  energyProductionValue: 0.9,
  // Round 38 (1200 mirrored 1v1 games): triggerBoth +1.51 VP per deal (z +1.84) – effect cards before the
  // cards that trigger them (human feedback: Lichen before Decomposers); penalty or bonus alone neutral.
  triggerOrderPenalty: 1,
  triggerOrderBonus: 0.5,
  sellToAfford: 0,
  // Rounds 39 + 40: buyForMilestone −0.62 and +0.07 VP per deal (pooled ≈ −0.3, z ≈ −0.3) – neutral, adopted for
  // the human game (one card short of Planner in the research phase).
  buyForMilestone: 1,
  // Round 39 (1200 mirrored 1v1 games): lastSale +1.76 VP per deal (z +2.53), openingPlan +0.62 (z +0.79) –
  // both fix human-game errors (passed with 15 cards; first greenery and city far apart), adopted.
  lastGenerationSale: 1,
  openingPlan: 1,
  lengthDeviation: 1,
  cityNeighbourShare: 0.6,
  exposedSpotRisk: 0.5,
  // Round 43 (1200 mirrored 1v1 games): awardActions +0.87 VP per deal (z +1.17), fixes a human-game error
  // (Edgedancer funded in the last generation at 3 : 1 while the opponent still had 46 M€) – adopted.
  awardActionSwing: 1,
  // Round 44: flowFit2 +0.42 VP per deal (z +0.55), flowFit (1) +0.02 – adopted at 2 for the human feedback (cards that
  // fit the direction of the own game; candidate, round 45 checks it with noFlowFit).
  // Round 45: flowFit3 +1.52 VP per deal (z +1.99) against flowFit 2 – adopted.
  // Round 63: flowFit4 +1.70 VP per deal (z +2.37; rounds 60/61 +0.74 each) – raised to 4.
  flowFit: 4,
  // Rounds 46 + 47: drawChoice4 +0.69 and +0.72 VP per deal (pooled z ≈ 1.3), drawChoice6 +1.04 (z +1.36) – adopted at 4,
  // it fixes a human-game error (Business Contacts and Invention Contest passed on).
  drawChoiceValue: 4,
  // Round 52 (1200 mirrored 1v1 games): energySupply +2.11 VP per deal (z +2.45) – adopted (player feedback).
  energySupply: 1,
  milestoneNear: 0,
  // Round 53 (1148 mirrored 1v1 games): greeneryRing1 +0.48 (z +0.68), fixes the human-game observation (greeneries
  // far from the city, more than two before it) – adopted at 1.
  // Round 55: greeneryRing15 +1.20 (pooled with round 54 +0.92, z ≈ 1.8) – raised to 1.5.
  greeneryRing: 1.5,
  // Round 55: stockAwardSwing03 +0.03 – neutral, fixes the human-game error (Space Elevator not played) – adopted.
  stockAwardSwing: 0.3,
  // Round 56: passLastResort2 −0.17 (neutral), fixes the human observation "passing is the last option" – adopted.
  passLastResort: 2,
  // Strategy-guide gaps (13.10.2026), off until tested.
  // Rounds 64/65: bonusRace +0.52/+0.19 (neutral to positive); a rated human game showed the AI raising the
  // temperature next to a bonus step the opponent then took – adopted as a human-game fix.
  bonusRace: 1,
  planHand: 0,
  // Round 64: turnTempo +1.59 VP per deal (z +2.26) – adopted (strategy guides: one action, then react).
  turnTempo: 1,
  exposure: 0,
  lateDenial: 0,
  // Round 66: collectorRate06 −0.23 (z −0.29) – neutral, fixes the human card-VP gap (collectors) – adopted with accumulatorValue 0.6.
  collectorRates: 1,
  recentPace: 0,
  // Round 73 (1200 mirrored 1v1 Venus games): worldGovernment +1.15 VP per deal (z +3.14) – adopted.
  worldGovernment: 1,
  // Round 74 (1200 mirrored 1v1 games, base and Venus): followUpChoice +0.38 (z +0.58) – adopted (fixes first-option follow-ups).
  followUpChoice: 1,
  followUpCards: 0,
  energyPlan: 0,
  // Round 76: +0.80 VP (z +1.23), fixes a tester-reported Energy Market error.
  followUpAmounts: 1,
  energyAsHeat: 0,
  // Round 76: −0.11 VP (z −0.17), neutral; fixes free award funding at 0 : 0 (tester report).
  awardFundingLead: 0.1,
};

// Champion/challenger: a change only becomes the baseline when it wins clearly more seats than
// expected (z ≥ 1.64); 100 games are often not enough.
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
  // 1v1 rounds (2026-10-09, mirrored deals): does the BGA card prior help,
  // and are VP collectors (Birds, Fish, Tardigrades …) undervalued? Human players scored big with them.
  noPrior: {cardPriorWeight: 0},
  strongPrior: {cardPriorWeight: 6},
  collectors: {accumulatorValue: 0.8},
  // Draft preferences of ~48 000 two-player BGA games.
  draftPrior: {draftPriorWeight: 1},
  draftPriorStrong: {draftPriorWeight: 2},
  draftPriorOnly: {draftPriorWeight: 2, cardPriorWeight: 0},
  // Corporation choice: Ecoline +2.7, UNMI −6.6 % points → with 3 M€ per point +8 / −20 M€.
  bgaCorporations: {corporationPriorWeight: 3},
  // Economy next to strong BGA winners: same M€ production, but half the plant
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
  // Human vs. hard (2026-10-09, 129 : 114): the AI funded Banker, Miner and Landlord with a lead and lost
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
  // Human test game (2026-10-09): the AI could have taken city spots next to his greeneries.
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
  // Human test game (2026-10-09): in generation 11 the AI built a city next to free land instead of a spot with
  // three greeneries and an ocean; free spots only become greeneries if there is time left.
  // Before round 19.
  boardHorizon3: {boardHorizon: 3},
  // Human feedback: play a card only if it brings something for the next generation; pure VP cards wait for
  // the last generation, when money is worth less. A VP is worth more M€ later in the game.
  laterPoints: {laterPointValue: 1},
  // Human feedback: synergies first (Viral Enhancers with plant/animal/microbe chains): effect cards are
  // measured with the own hand, not only with random future cards.
  noHandSynergy: {handSynergy: 0},
  // Rollouts made a 2P test game take ~600 s: clear decisions (best move 5 M€ ahead) skip them.
  rolloutGate: {rolloutMargin: 5},
  // Human test game: the first city went next to Noctis although better standard spots exist (BGA: D7, G4, C5).
  // Before round 20: no BGA spot prior.
  noCitySpots: {citySpotPrior: 0},
  // Human feedback: remember the cards seen in the draft, like a human player.
  noDraftMemory: {draftMemory: 0},
  // Strategy guides (rusliksu/tm-tierlist): a bought card needs a play window of 1–3 generations,
  // a big hand without money is frozen capital. Three-player human game: in generation 5, 8 of 11
  // hand cards waited for global parameters.
  playWindow: {playWindow: 1},
  // Human test game (2026-10-10): Banker funded at 19 : 7 in generation 12, lost 22 : 33 – the human's engine came late.
  noAwardTrend: {awardTrend: 0},
  // A human won twice with a late engine while the AI led on TR: end the game sooner (closer was neutral at 1).
  closer2: {closer: 2},
  // Round 50: around the adopted closer 1.
  noCloser: {closer: 0},
  closer05: {closer: 0.5},
  closer1: {closer: 1},
  closer15: {closer: 1.5},
  // handSynergy only acts through engineValue, which needs engineWeight > 0 (round 21 measured noise).
  engine1: {engineWeight: 1},
  // Rollouts at a price human games can bear: 2 moves, 0.6 s, only close decisions.
  rolloutCheap: {rolloutCandidates: 2, rolloutBudget: 600, rolloutMargin: 5},
  // Round 23: weights tuned against earlier baselines, re-checked against today's one (no extra computing time).
  draftDenial75: {draftDenial: 0.75},
  draftDenial25: {draftDenial: 0.25},
  prior45: {cardPriorWeight: 4.5},
  // Round 24: a test game takes ~30 s on the reference machine, 60 s are acceptable – spend the time on search.
  search16: {secondStepCandidates: 16},
  rolloutTiny: {rolloutCandidates: 2, rolloutBudget: 300, rolloutMargin: 3},
  // rolloutCheap took 62 s per test game instead of 28 s: every move inside a rollout tried 8 moves on
  // game copies, to the end of the generation, for every close decision. Cheaper: 3 moves, 8 actions
  // deep, key decisions only – or quick rules without copies at all.
  rolloutFast: {rolloutCandidates: 2, rolloutBudget: 600, rolloutMargin: 5, rolloutPolicyMoves: 3, rolloutHorizon: 8, rolloutFocus: 1},
  rolloutQuick: {rolloutCandidates: 2, rolloutBudget: 600, rolloutMargin: 5, rolloutPolicyMoves: 0, rolloutHorizon: 8, rolloutFocus: 1},
  // Human test game (2026-10-10): passed in the last generation with 47 M€ next to three free spots,
  // the human filled them next to his cities.
  lastSpots: {lastGenerationSpots: 1},
  // Before 2026-10-10: money after a pass in the last generation kept its greenery value.
  passedMoneyKept: {passedMoneyLost: 0},
  rolloutFastWide: {rolloutCandidates: 3, rolloutBudget: 1000, rolloutMargin: 5, rolloutPolicyMoves: 3, rolloutHorizon: 8, rolloutFocus: 1},
  // Human test games (2026-10-10): Jovian tag stacking, 7–8 VP per Water Import / Ganymede Colony / Io Mining.
  tagOutlook: {tagPointOutlook: 1},
  tagOutlook60: {tagPointOutlook: 0.6},
  // Before round 28: per-tag VP cards valued with today's tags only.
  noTagOutlook: {tagPointOutlook: 0},
  // Human test games (2026-10-10): the human took all three milestones by generation 6 (15 : 0 VP);
  // progress towards a milestone worth more pushes the AI into the race earlier.
  milestoneRace75: {milestoneProgressShare: 0.75},
  milestoneRace90: {milestoneProgressShare: 0.9},
  milestoneRace30: {milestoneProgressShare: 0.3},
  // Bundle of small, repeatedly positive changes (rounds 23–28: moreCardsAgain +0.17/+0.44/+0.12, production105
  // +0.38, search16 +0.55): tested together with all games, so a combined gain of ~1 VP becomes measurable.
  // Human test game (2026-10-10, 84 : 186): the AI bought nine energy cards (Power Infrastructure, Fusion Power,
  // Quantum Extractor …) with few uses for the energy – is energy production overvalued?
  energy07: {energyProductionValue: 0.7},
  energy09: {energyProductionValue: 0.9},
  energy08: {energyProductionValue: 0.8},
  energy11: {energyProductionValue: 1.1},
  // Round 31: energy07 −2.4 VP (z −2.9), energy09 −0.1 – maybe energy is worth more, not less.
  energy13: {energyProductionValue: 1.3},
  energy15: {energyProductionValue: 1.5},
  // Before round 32: milestone progress at half of its 5 VP.
  milestone50: {milestoneProgressShare: 0.5},
  production115: {productionDiscount: 1.15},
  // Round 33: further along the adopted directions (less milestone chasing, more cards; pass penalty with the new baseline).
  milestone15: {milestoneProgressShare: 0.15},
  milestone0: {milestoneProgressShare: 0},
  cards14: {buyMargin: -4, handTargetEarly: 14, handTargetLate: 6},
  pass02: {passPenalty: 0.2},
  // Round 34: control of the adoption, award risk and plant production with today's baseline.
  milestone30: {milestoneProgressShare: 0.3},
  awardSwing0: {awardSwing: 0},
  plants25b: {plantProductionValue: 2.5},
  // Round 35: awardSwing0 lost (−1.75 VP) – maybe more award caution helps; VP value and card prior re-checked.
  vp110: {victoryPointScale: 1.1},
  vp90: {victoryPointScale: 0.9},
  prior2: {cardPriorWeight: 2},
  // Round 35 candidates together (awardRisk30 +1.00 z +1.44, prior2 +0.73 z +0.99), tested with all games.
  bundle2: {awardSwing: 0.3, cardPriorWeight: 2},
  // Before round 37: the baseline without bundle2.
  beforeBundle2: {awardSwing: 0.15, cardPriorWeight: 3},
  // Round 37: further along both directions and the hate draft with today's baseline.
  award45: {awardSwing: 0.45},
  prior1: {cardPriorWeight: 1},
  denial25b: {draftDenial: 0.25},
  denial75b: {draftDenial: 0.75},
  // Round 38: effect cards before the hand cards that trigger them (human feedback: Lichen before Decomposers).
  triggerOrder: {triggerOrderPenalty: 1},
  triggerBonus: {triggerOrderBonus: 0.5},
  triggerBoth: {triggerOrderPenalty: 1, triggerOrderBonus: 0.5},
  // Human feedback: sell a card or two when only that much is missing for a milestone.
  // Before round 39: the baseline without the trigger order.
  noTriggerOrder: {triggerOrderPenalty: 0, triggerOrderBonus: 0},
  // Before round 40: the baseline without lastSale and openingPlan.
  beforeRound40: {lastGenerationSale: 0, openingPlan: 0},
  // Round 41: a human rush ended a game in generation 8 – let the observed speed count more.
  lengthFlex2: {lengthDeviation: 2},
  lengthFlex3: {lengthDeviation: 3},
  // Round 42: further along – how far may the observed speed move the estimate?
  lengthFlex4: {lengthDeviation: 4},
  lengthFlex5: {lengthDeviation: 5},
  // Round 43: human games – the AI builds 3–6 cities against 8–12 and its lonely greeneries feed the human's cities.
  cityShare80: {cityNeighbourShare: 0.8},
  cityShare45: {cityNeighbourShare: 0.45},
  exposedRisk80: {exposedSpotRisk: 0.8},
  // Human game: Edgedancer funded in the last generation at 3 : 1 and lost 3 : 5 – the opponent still had money and actions.
  awardActions: {awardActionSwing: 1},
  noAwardActions: {awardActionSwing: 0},
  // Human games: humans play ~3× as many card-drawing cards and draw 1.2 cards per generation against 0.3.
  // drawCards: round 19 variant again on today's baseline; cardIncome: tag-triggered draws as income too.
  cardIncome: {drawCardModel: 2},
  // Human feedback: not the best card but the one that fits the direction the own game has taken.
  flowFit: {flowFit: 1},
  flowFit2: {flowFit: 2},
  // Round 45: controls for the round 44 adoptions and a stronger fit.
  noCardIncome: {drawCardModel: 0},
  noFlowFit: {flowFit: 0},
  flowFit3: {flowFit: 3},
  flowFit4: {flowFit: 4},
  // Round 47: flowFit4 +0.52 (z +0.53) in round 46 – again, and a step further.
  flowFit5: {flowFit: 5},
  // Human game: Business Contacts (−2) and Invention Contest (0) passed on, the human built a card engine with them.
  drawChoice2: {drawChoiceValue: 2},
  drawChoice4: {drawChoiceValue: 4},
  // Round 46: drawChoice2 −1.25, drawChoice4 +0.69 – noisy; round 47 repeats 4 and tries 6.
  drawChoice6: {drawChoiceValue: 6},
  drawChoice5: {drawChoiceValue: 5},
  drawChoice8: {drawChoiceValue: 8},
  // Player feedback (public server): the AI plays energy-spending action cards without energy production.
  energySupply: {energySupply: 1},
  // Human games (public server): the human claimed all three milestones in four of twelve games.
  milestoneNear2: {milestoneNear: 2},
  milestoneNear3: {milestoneNear: 3},
  // Human feedback: greeneries far from the own city, on spots no city can reach, up to four before the city.
  greeneryRing1: {greeneryRing: 1},
  greeneryRing2: {greeneryRing: 2},
  greeneryRing05: {greeneryRing: 0.5},
  greeneryRing15: {greeneryRing: 1.5},
  noGreeneryRing: {greeneryRing: 0},
  closer075: {closer: 0.75},
  // Human game: kept 6 titanium for a safe Miner lead instead of playing Space Elevator (2 VP).
  stockAwardSwing03: {stockAwardSwing: 0.3},
  stockAwardSwing0: {stockAwardSwing: 0},
  stockAwardSwing1: {stockAwardSwing: 1},
  // Human feedback "passing is the last option": 26 % of AI passes had another move, often a near-tie.
  passLastResort2: {passLastResort: 2},
  passLastResort5: {passLastResort: 5},
  passLastResort1: {passLastResort: 1},
  passLastResort3: {passLastResort: 3},
  passPenalty05: {passPenalty: 0.5},
  passPenalty0: {passPenalty: 0},
  passPenalty1: {passPenalty: 1},
  noPassLastResort: {passLastResort: 0},
  greeneryRing3: {greeneryRing: 3},
  noEnergySupply: {energySupply: 0},
  noDrawChoice: {drawChoiceValue: 0},
  // Round 48: animal and other collector cards (human card-VP engines, 5 games) with today's flow fit.
  collectors04: {accumulatorValue: 0.4},
  // 31 public-server games (12./13.10.): card VP human 44.5 vs AI 17.9; humans take animal/VP collectors far more often.
  collectors06: {accumulatorValue: 0.6},
  collectors1: {accumulatorValue: 1},
  // Strategy guides: snatch bonus steps, never open one for the rival.
  bonusRace: {bonusRace: 1},
  bonusRace05: {bonusRace: 0.5},
  noBonusRace: {bonusRace: 0},
  // Strategy guides: bigger hand with the stronger engine, fewer cards (VP pivot) when behind on income.
  planHand: {planHand: 1},
  // Strategy guides: one action, then wait and react; two only for races.
  turnTempo: {turnTempo: 1},
  turnTempo3: {turnTempo: 3},
  noTurnTempo: {turnTempo: 0},
  // Strategy guides: plants and animals can be taken by the rival's attack cards.
  exposure: {exposure: 1},
  // Strategy guides: hate-draft harder near the end.
  lateDenial: {lateDenial: 1},
  // Collectors by their measured feeding rate (flat collectors lost in round 63).
  collectorRate06: {accumulatorValue: 0.6, collectorRates: 1},
  collectorRate1: {accumulatorValue: 1, collectorRates: 1},
  collectorRate04: {accumulatorValue: 0.4, collectorRates: 1},
  collectorRate02: {accumulatorValue: 0.2, collectorRates: 1},
  collectorRate08: {accumulatorValue: 0.8, collectorRates: 1},
  noCollectors: {accumulatorValue: 0, collectorRates: 0},
  // Human rush ended a game in generation 8: shorten the estimate by the last generation's pace.
  recentPace1: {recentPace: 1},
  recentPace2: {recentPace: 2},
  // Venus games: World Government chose temperature every time (first option).
  worldGovernment: {worldGovernment: 1},
  noWorldGovernment: {worldGovernment: 0},
  followUpChoice: {followUpChoice: 1},
  noFollowUpChoice: {followUpChoice: 0},
  followUpCards: {followUpCards: 1},
  energyPlan: {energyPlan: 1},
  followUpAmounts: {followUpAmounts: 1},
  energyAsHeat: {energyAsHeat: 1},
  awardLead: {awardFundingLead: 0.1},
  noFollowUpAmounts: {followUpAmounts: 0},
  noAwardLead: {awardFundingLead: 0},
  awardLead20: {awardFundingLead: 0.2},
  // Control for the opening plan after the cache fix (plans of game copies were shared by tile count).
  noOpeningPlan: {openingPlan: 0},
  // Round 39: selling for milestones and awards −7.0 VP per deal (z −8.4); round 40 tries milestones only.
  sellToAfford: {sellToAfford: 2},
  sellForMilestone: {sellToAfford: 1},
  // Human feedback: one card more in the research phase would have made Planner claimable.
  buyForMilestone: {buyForMilestone: 1},
  milestoneMoney: {sellToAfford: 1, buyForMilestone: 1},
  // Human feedback: passed in the last generation with 15 cards – selling most of them would have paid for points.
  lastSale: {lastGenerationSale: 1},
  // Human feedback: first greenery far off at two oceans, first city at the other end – plan the home cluster.
  openingPlan: {openingPlan: 1},
  // Before round 31: the baseline without bundle1.
  beforeBundle1: {buyMargin: -1, handTargetEarly: 9, handTargetLate: 4, productionDiscount: 0.9, secondStepCandidates: 12},
  bundle1: {buyMargin: -3, handTargetEarly: 12, handTargetLate: 5, productionDiscount: 1.05, secondStepCandidates: 16},
  // Round 25: rolloutFast +1.0 VP (z +1.25) at 34 s per test game – re-checked with variations.
  rolloutFastDeep: {rolloutCandidates: 2, rolloutBudget: 600, rolloutMargin: 5, rolloutPolicyMoves: 3, rolloutHorizon: 16, rolloutFocus: 1},
  rolloutFastAll: {rolloutCandidates: 2, rolloutBudget: 600, rolloutMargin: 5, rolloutPolicyMoves: 3, rolloutHorizon: 8, rolloutFocus: 0},
  rolloutFastLong: {rolloutCandidates: 2, rolloutBudget: 1200, rolloutMargin: 5, rolloutPolicyMoves: 3, rolloutHorizon: 8, rolloutFocus: 1},
  // 2026-10-15: rollout3 (+2.7 VP in round 18) re-run affordably – each policy step with 8 moves cost ~87 ms per
  // rollout, so 3 finalists × 8 rounds hit the 2 s limit. Fewer rounds and quick rules for the opponents cut that ~5×.
  rollout3Lean: {rolloutCandidates: 3, rolloutBudget: 2000, rolloutMaximumRounds: 3, rolloutOpponentPolicyMoves: 0},
  rollout3Rounds: {rolloutCandidates: 3, rolloutBudget: 2000, rolloutMaximumRounds: 3},
  rollout4Rounds: {rolloutCandidates: 4},
  // Round 81: the time saved by the lean rollouts spent elsewhere, plus the old full opponent policy as control.
  rolloutFull: {rolloutOpponentPolicyMoves: -1},
  lean4: {rolloutCandidates: 4},
  leanRounds5: {rolloutMaximumRounds: 5},
  // Round 82: human game (2026-10-15): 3 cities against 9, own greeneries fed the opponent's cities with 9 VP –
  // city appetite and the risk of lonely greeneries re-checked now that rollouts are on.
  cityExposed80: {cityNeighbourShare: 0.8, exposedSpotRisk: 0.8},
  // Round 83: cheaper rollouts (skip clear decisions, fewer own moves per step) – time for later spending.
  rolloutMargin5: {rolloutMargin: 5},
  rolloutPolicy4: {rolloutPolicyMoves: 4},
  // Round 84: rolloutPolicy4 lost 1.5 VP – do more own moves per step help? Opponents with a few moves instead of quick rules.
  rolloutPolicy12: {rolloutPolicyMoves: 12},
  opponentPolicy2: {rolloutOpponentPolicyMoves: 2},
  // Human game (2026-10-15): M€ production stayed at 6–7 until generation 10 (human 7 → 48), the AI went for TR.
  // Income re-checked now that rollouts end every look-ahead at the generation's end.
  production125: {productionDiscount: 1.25},
  production140: {productionDiscount: 1.4},
  // Human game (2026-10-15): Miner lost 9 : 10 after paying with steel in the last generation (game lost by 2 VP).
  keepAwardStock: {keepAwardStock: 1},
  noKeepAwardStock: {keepAwardStock: 0},
  // Human games (2026-10-15): hand 14–24 cards, 13 sold at the end – buy only cards worth clearly more than 3 M€.
  buyStrict: {buyMargin: -1},
  buyStricter: {buyMargin: 1},
  buyStrictest: {buyMargin: 3},
  // ML stage 2 (learned final VP margin from about 43,000 BGA two-player games, certain VP 1 : 1, AUC 0.80):
  // blend the model's win chance into the hand-made valuation.
  valueModel25: {valueModel: 0.25},
  valueModel50: {valueModel: 0.5},
  valueModel75: {valueModel: 0.75},
  valueModel15: {valueModel: 0.15},
  valueModel35: {valueModel: 0.35},
  noValueModel: {valueModel: 0},
  openingModel0: {valueModelOpening: 0},
  openingModel50: {valueModelOpening: 0.5},
  engine15: {incomeWeight: 1.5, terraformBrake: 2},
  engine20: {incomeWeight: 2, terraformBrake: 3},
  engine30: {incomeWeight: 3, terraformBrake: 4},
  // Analysis log (2026-10-16): Business Contacts in generation 10 kept two cards by statistics only.
  keepValued: {keepValuation: 1},
  // Rated human game (2026-10-16): Mars University discarded Birds in generation 13 (quick rule keeps VP cards first).
  discardValued: {discardValuation: 1},
  noDiscardValued: {discardValuation: 0},
  // Rated human game (2026-10-16): heat converted to −26 °C and later a city before the 0 °C step – both bonus
  // steps went to the human (bonusRace 1 left them open). Twice the weight for open bonus steps.
  bonusRace2: {bonusRace: 2},
  // Human player (2026-10-16): funded Scientist early because his hand held about ten science tags.
  awardHand: {awardHandOutlook: 0.7},
  noAwardHand: {awardHandOutlook: 0},
  noLateBoardCards: {lateBoardCards: 0},
};

export function isTuningVariant(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(TUNING_VARIANTS, name);
}

// Two-player games (the main use case) can differ from the baseline of 3–5 players; found with the
// mirrored 1v1 rounds (AI test batches). Variants apply on top of it.
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
