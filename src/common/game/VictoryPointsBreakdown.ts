import {Tag} from '../cards/Tag';

export type MADetail = {message: string, messageArgs?: Array<string>, victoryPoint: number};

/** Dune expansion, House schemes: the agenda that scores and its level (1 easy, 2 medium, 3 hard) */
export type SchemeDetail = {agenda: string, level: number, victoryPoint: number};

export type VictoryPointsBreakdown = {
  terraformRating: number;
  milestones: number;
  awards: number;
  greenery: number;
  city: number;
  escapeVelocity: number;
  moonHabitats: number;
  moonMines: number;
  moonRoads: number;
  planetaryTracks: number;
  // Dune expansion: VP of the House schemes agendas
  schemes: number;
  victoryPoints: number;
  total: number;
  detailsCards: ReadonlyArray<{cardName: string, victoryPoint: number}>;
  detailsMilestones: ReadonlyArray<MADetail>;
  detailsAwards: ReadonlyArray<MADetail>;
  detailsPlanetaryTracks: ReadonlyArray<{tag: Tag, points: number}>;
  // Only filled at game end – agendas are secret while the game runs
  detailsSchemes: ReadonlyArray<SchemeDetail>;
  // Total VP less than 0. For Underworld
  negativeVP: number;
}
