import type {AiTuning} from './aiTuning';
import type {StyleFocus} from './styleFocus';

// Strategy styles: AI opponents that each push one plan the way human players do, instead of one balanced AI.
// Used as sparring partners in test rounds (a change must hold up against card engines, rushers, award hunters …,
// not only against a copy of itself) and later as selectable opponent personalities.
// Round 100: styles made of shifted weights alone played almost like the baseline (cards 46.9 vs 45.8, same game
// length). Each style now has a strategy focus – extra VP for what it is after (styleFocus.ts) – plus fitting weights.
function focus(values: Partial<StyleFocus>): StyleFocus {
  return {playedCard: 0, handCard: 0, terraformRating: 0, production: 0, greenery: 0, city: 0, milestone: 0, fundedAward: 0, ...values};
}

export const STRATEGY_STYLES: Record<string, Partial<AiTuning>> = {
  // Card engine: draws and plays as many cards as possible, builds income first, terraforms late.
  styleCards: {styleFocus: focus({playedCard: 0.6, handCard: 0.2}), drawPriority: 7, tierListWeight: 2, buyMargin: -5,
    handTargetEarly: 16, phasePlan: 1},
  // Terraformer: raises the global parameters as fast as possible and ends the game early.
  styleTerraform: {styleFocus: focus({terraformRating: 0.7}), terraformBrake: -4, phasePlan: 0, closer: 1.5},
  // Economist: production of every kind above all, points come from the money later.
  styleIncome: {styleFocus: focus({production: 0.5}), phasePlan: 1},
  // Milestones and awards at any price.
  styleMilestones: {styleFocus: focus({milestone: 4, fundedAward: 2}), milestoneNear: 4, buyForMilestone: 2, awardFundingLead: 0},
  // Gardener: plant production and greeneries, rings around own cities.
  styleGreenery: {styleFocus: focus({greenery: 1.5}), plantProductionValue: 3.5, greeneryRing: 3, phasePlan: 0},
  // City builder: many cities on good spots, takes the opponent's spots away.
  styleCities: {styleFocus: focus({city: 2.5}), citySpotPrior: 2, cityDenialShare: 1, sharedSpotShare: 0.8},
};
