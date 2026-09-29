import {IMilestone} from './IMilestone';
import {IPlayer} from '../IPlayer';
import {Turmoil} from '../turmoil/Turmoil';
import {IGame} from '../IGame';

export class Terraformer implements IMilestone {
  public readonly name = 'Terraformer';
  private terraformRating: number = 35;
  private terraformRatingTurmoil: number = 26;
  public readonly description;
  constructor() {
    this.description = 'Have a terraform rating of 35 (or 26 with Turmoil.)';
  }
  public getScore(player: IPlayer): number {
    return player.terraformRating;
  }
  public thresholdFor(game: IGame): number {
    return Turmoil.ifTurmoilElse(game, () => this.terraformRatingTurmoil, () => this.terraformRating);
  }
  public canClaim(player: IPlayer): boolean {
    return this.getScore(player) >= this.thresholdFor(player.game);
  }
}
