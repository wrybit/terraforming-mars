// Rules of the Dune modules as short cards (DuneRuleCards.vue). English texts, translated on display.

export type DuneRuleSign = 'enter' | 'slide' | 'leave' | 'tap' | 'payout';

/** One rule: a Dune picture (assets/themes/dune/graphics) or a drawn sign, and one short line */
export type DuneRule = {picture?: string, sign?: DuneRuleSign, text: string};

export const BAZAAR_RULES: ReadonlyArray<DuneRule> = [
  {picture: 'special-bazaar', text: '32 wares, each 10 % below its card value'},
  {sign: 'enter', text: 'Every generation a new ware comes in on the left'},
  {sign: 'slide', text: 'The others slide right and get cheaper'},
  {sign: 'leave', text: 'Whatever drops out on the right is gone'},
  {sign: 'tap', text: 'Buying is an action: one ware per player and generation'},
  {sign: 'payout', text: 'Bought: pays out at once, then to the discard pile'},
  {picture: 'coin', text: 'The owner of the Commercial District pays 2 Solari less'},
];
