import {IPlayer} from '../IPlayer';
import {tuningOf} from './aiTuning';

// The closer term (stateValue.ts) weighs how much ending the game sooner changes the final margin to the rival:
// generations cut × (rival engine − own engine). It is the same whether the AI leads or trails. In human games the
// AI trailed far behind a stronger engine and kept placing greeneries instead of closing the last temperature
// steps (rated "should end the game when engine is weak"); a trailing player loses more with every extra
// generation of the rival's engine. closerBehind scales the term up only while the AI's position is behind the
// rival's. Different from closer2 (round 49: double weight everywhere, −0.55): the leader is left unchanged.

/** Factor for the closer term: 1 + closerBehind while the own position is worth less than the rival's. */
export function closerBehindFactor(player: IPlayer, ownValue: number, rivalValue: number): number {
  const weight = tuningOf(player).closerBehind;
  if (weight <= 0 || ownValue >= rivalValue) {
    return 1;
  }
  return 1 + weight;
}
