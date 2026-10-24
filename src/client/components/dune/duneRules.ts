import {ArrakisLayout} from '@/common/dune/arrakisLayout';
import {arrakisCoordinate} from '@/common/dune/arrakisCoordinates';

// Rules of the Dune modules as a short list (DuneRuleCards.vue). English texts, translated on display.

export type DuneRuleSign = 'enter' | 'slide' | 'leave' | 'tap' | 'payout' | 'battle' | 'flag' | 'shield' | 'levels' | 'keep' | 'hidden' | 'die';

/** One rule: a Dune picture (assets/themes/dune/graphics) or a drawn sign, and one short line; `detail` follows the
 *  translated line untranslated (e.g. coordinates) */
export type DuneRule = {picture?: string, sign?: DuneRuleSign, text: string, detail?: string};

export const BAZAAR_RULES: ReadonlyArray<DuneRule> = [
  {picture: 'special-bazaar', text: '32 wares, each 10 % below its card value'},
  {sign: 'enter', text: 'At the start one ware per player lies out from the left'},
  {sign: 'slide', text: 'Every generation all wares slide right, close the gaps and get cheaper'},
  {sign: 'leave', text: 'Whatever drops out on the right is gone'},
  {sign: 'enter', text: 'New wares fill every free slot left of the first ware'},
  {sign: 'tap', text: 'Buying is an action: one ware per player and generation'},
  {sign: 'payout', text: 'Bought: pays out at once, then to the discard pile'},
  {picture: 'coin', text: 'The owner of the Commercial District pays 2 Solari less'},
];

export const KANLY_RULES: ReadonlyArray<DuneRule> = [
  {picture: 'res-sardaukar', text: 'Recruit: 12 M€, 4 titanium, 6 steel, 5 heat or 6 energy per Sardaukar'},
  {sign: 'tap', text: 'At most 2 Sardaukar per action'},
  {picture: 'coin', text: 'Opening a Kanly costs 8 M€ and sends at least 1 Sardaukar'},
  {sign: 'battle', text: 'One battle per generation, on an opponent tile'},
  {sign: 'flag', text: 'End of generation: most Sardaukar on the war field take the tile'},
  {sign: 'shield', text: 'A tie keeps the tile with its owner'},
];

export const SCHEMES_RULES: ReadonlyArray<DuneRule> = [
  {picture: 'res-advisor', text: 'Everybody draws two secret agendas'},
  {sign: 'levels', text: 'Three levels per agenda: easy, medium, hard'},
  {sign: 'keep', text: 'Once a player reaches 35 TR, everybody keeps one of the two'},
  {sign: 'payout', text: 'At game end only the highest level reached counts'},
  {sign: 'hidden', text: 'The others never see your agendas'},
];

export const SMUGGLING_RULES: ReadonlyArray<DuneRule> = [
  {picture: 'special-smugglers-market', text: 'Move spice: up to 5 titanium per deal at the current spice rate'},
  {picture: 'coin', text: 'Exchange: the rates change every generation – sell high, buy low'},
  {sign: 'levels', text: 'Every deal raises the suspicion by 1'},
  {sign: 'shield', text: 'A bribe (10 M€, Industrial Center owner 7) lowers it by 1'},
  {sign: 'flag', text: 'End of generation: 0 and 1 are free, from 2 on TR is lost and the marker drops back to 0'},
  {sign: 'hidden', text: 'At 4 all trading stops until a bribe lowers it'},
];

// Shai-Hulud: what the worm does to the spaces it crosses
const WORM_EFFECT_RULES: ReadonlyArray<DuneRule> = [
  {picture: 'tile-small-spicefield', text: 'Spice field: +1 spice for each adjacent tile of a player'},
  {picture: 'tile-small-sietch', text: 'City: worm riders, the owner gains 1 spice and 2 heat'},
  {picture: 'tile-small-planting', text: 'Greenery: trampled, the owner loses 3 plants'},
  {picture: 'tile-small-special', text: 'Special tile: damaged, the owner loses 3 M€'},
  {picture: 'special-worm-domain', text: 'Natural Preserve: the worm stops, the owner gains 1 TR'},
];

// Shai-Hulud: where the worm starts on the game's board (Jens, 19 Oct 2026) and what it does to the spaces it crosses
export function wormRules(layout: ArrakisLayout): ReadonlyArray<DuneRule> {
  return [
    {picture: 'token-worm', text: 'Start: the worm starts at random on one of these spaces:',
      detail: layout.wormStartSpaces.map((spaceId) => arrakisCoordinate(layout, spaceId)).join(', ')},
    // How far and how it moves (common/dune/wormDistance.ts, server/dune/Worm.ts; Jens, 21 Oct 2026)
    {picture: 'par-vegetation', text: 'Distance: the vegetation track in three sections – the more greeneries, the shorter the move (3, 2, 1 spaces)'},
    // Direction: one die, a second roll for the same line as last time (server/dune/Worm.ts rollWorm; Jens, 22 Oct 2026)
    {sign: 'die', text: 'Direction: a die – the same line as the last move (either way) is rolled once more'},
    {sign: 'slide', text: 'Obstacles (rock, cities, polar border, board edge): the worm bounces off like a ball off a wall – bouncing costs no step'},
    ...WORM_EFFECT_RULES,
  ];
}

// CHOAM contracts (Jens, 19 Oct 2026: as a short list like the other modules)
export const CHOAM_RULES: ReadonlyArray<DuneRule> = [
  {picture: 'choam', text: 'Offer (action): goods leave your stock, with a wish of up to 30 in return'},
  {sign: 'keep', text: 'At most 1 open offer per player (Guild Bank card: 2)'},
  {sign: 'tap', text: 'Accept (action): first come, first harvested'},
  {picture: 'coin', text: 'On a deal seller and buyer each pay 1 Solari to the bank'},
  {sign: 'leave', text: 'Withdraw (action): the goods come back, no fee'},
  {sign: 'enter', text: 'An offer stands for 2 generations; if nobody takes it, it returns without a fee'},
];
