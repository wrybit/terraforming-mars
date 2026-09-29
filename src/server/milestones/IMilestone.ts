import {MilestoneName} from '../../common/ma/MilestoneName';
import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';

export interface IMilestone {
  name: MilestoneName;
  description: string;
  canClaim(player: IPlayer): boolean;
  getScore(player: IPlayer): number;
  // Schwelle für die Anzeige in der Meilenstein-Tabelle; nur bei Meilensteinen mit einfacher Zahl
  thresholdFor?(game: IGame): number;
}

export abstract class BaseMilestone implements IMilestone {
  public readonly name: MilestoneName;
  public readonly description: string;
  public readonly threshold: number;

  constructor(name: MilestoneName, description: string, threshold: number) {
    this.name = name;
    this.description = description;
    this.threshold = threshold;
  }

  public abstract getScore(player: IPlayer): number;
  public thresholdFor(): number {
    return this.threshold;
  }
  public canClaim(player: IPlayer): boolean {
    return this.getScore(player) >= this.threshold;
  }
}
