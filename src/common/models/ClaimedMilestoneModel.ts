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
  // Zu erreichender Wert (z. B. 35 TR); fehlt bei Meilensteinen ohne einfache Schwelle
  threshold?: number;
  scores: Array<MilestoneScore>;
}
