import type {AiTuning} from './aiTuning';

// Strategy styles: AI opponents that each push one plan the way human players do, instead of one balanced AI.
// Used as sparring partners in test rounds (a change must hold up against card engines, rushers, award hunters …,
// not only against a copy of itself) and later as selectable opponent personalities.
// Each style is a set of tuning weights on top of the baseline (aiTuning.ts).
export const STRATEGY_STYLES: Record<string, Partial<AiTuning>> = {
  // Card engine: draws and plays as many cards as possible, builds income first, terraforms late.
  styleCards: {drawPriority: 7, tierListWeight: 2, buyMargin: -5, handTargetEarly: 16, phasePlan: 1, terraformBrake: 2},
  // Terraformer: raises the global parameters as fast as possible and ends the game early.
  styleTerraform: {terraformBrake: -4, phasePlan: 0, drawPriority: 2, closer: 1.5, productionDiscount: 0.8},
  // Economist: production of every kind above all, points come from the money later.
  styleIncome: {phasePlan: 2, productionDiscount: 1.4},
  // Milestones and awards at any price.
  styleMilestones: {milestoneProgressShare: 0.8, milestoneNear: 6, buyForMilestone: 2, awardSwing: 0.6, awardFundingLead: 0},
  // Gardener: plant production and greeneries, rings around own cities.
  styleGreenery: {plantProductionValue: 3.5, greeneryRing: 3, terraformBrake: -1, phasePlan: 0},
  // City builder: many cities on good spots, takes the opponent's spots away.
  styleCities: {citySpotPrior: 2, cityDenialShare: 1, sharedSpotShare: 0.8, cityNeighbourShare: 1},
};
