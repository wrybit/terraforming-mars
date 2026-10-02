import {AdminGameSummary} from '../admin/AdminGameSummary';
import {CardName} from '../cards/CardName';
import {BoardName} from '../boards/BoardName';
import {Expansion} from '../cards/GameModule';
import {MilestoneName} from '../ma/MilestoneName';
import {AwardName} from '../ma/AwardName';
import {SpaceId} from '../Types';

// Contract between the stats API (server) and the stats page (client): both sides read and write exactly this shape.

/** Victory points by source, as in the breakdown on the results page. */
export type StatsVictoryPoints = {
  terraformRating: number;
  milestones: number;
  awards: number;
  greenery: number;
  city: number;
  cards: number;
  /** Everything else (Moon, escape velocity, Pathfinders tracks …). */
  other: number;
  total: number;
};

export type StatsCardPoints = {
  name: CardName;
  points: number;
};

/** What is known about a player of a game once the final score is available. Missing values were not readable. */
export type StatsPlayerDetails = {
  name: string;
  /** Played cards incl. corporation and preludes; for screenshots only the cards with victory points (cardsComplete). */
  cards: Array<CardName>;
  /** Victory points per card (only cards that can give points). */
  cardPoints?: Array<StatsCardPoints>;
  terraformRating?: number;
  greeneries?: number;
  cities?: number;
  victoryPoints?: StatsVictoryPoints;
  /** Victory points at the end of each generation (index 0 = generation 1). */
  pointsByGeneration?: Array<number>;
  megaCredits?: number;
  /** Thinking time over the whole game. */
  timeSeconds?: number;
  actions?: number;
};

export type StatsClaimedMilestone = {
  name: MilestoneName;
  playerName: string;
};

export type StatsFundedAward = {
  name: AwardName;
  funderName: string;
  /** All players in 1st place of the award (several on a tie). */
  winnerNames: Array<string>;
  /** Players in 2nd place (they only score with more than two players). */
  secondNames?: Array<string>;
};

/** Progress of the global parameters in percent at the end of each generation. */
export type StatsGlobals = {
  temperature: Array<number>;
  oxygen: Array<number>;
  oceans: Array<number>;
  venus?: Array<number>;
};

/** A city or greenery tile at the end of the game – basis of the heatmap. */
export type StatsTile = {
  spaceId: SpaceId;
  type: 'city' | 'greenery';
  playerName: string;
};

export type StatsGameDetails = {
  /** Read from the game state or read off a screenshot of the results page. */
  source: 'game' | 'screenshot';
  /** False: cards only contains the cards with victory points (a screenshot shows no more). */
  cardsComplete: boolean;
  boardName: BoardName | undefined;
  expansions: Array<Expansion>;
  players: Array<StatsPlayerDetails>;
  milestones: Array<StatsClaimedMilestone>;
  awards: Array<StatsFundedAward>;
  globalsByGeneration?: StatsGlobals;
  /** Only from the game state; a screenshot doesn't show the board. */
  tiles?: Array<StatsTile>;
};

/** A finished game, as the stats see it. */
export type StatsGame = {
  /** Same summary as in the admin overview – without player links, the page is public. */
  summary: AdminGameSummary;
  /** Results page on this server or stored screenshot. */
  resultUrl: string | undefined;
  /** Missing if nothing further is known about the result. */
  details: StatsGameDetails | undefined;
};
