import {Color} from '../Color';
import {MilestoneName} from '../ma/MilestoneName';

export type MilestoneScore = {
  color: Color;
  score: number;
  claimable: boolean;
}

export type ClaimedMilestoneModel = {
  name: MilestoneName;
  playerName: string | undefined;
  color: Color | undefined;
  // Target value (e.g. 35 TR); missing for milestones without a simple threshold
  threshold?: number;
  scores: Array<MilestoneScore>;
}
