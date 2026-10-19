// Rules of the Dune modules as a short list (DuneRuleCards.vue). English texts, translated on display.

export type DuneRuleSign = 'enter' | 'slide' | 'leave' | 'tap' | 'payout' | 'battle' | 'flag' | 'shield' | 'levels' | 'keep' | 'hidden';

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
  {picture: 'special-smugglers-market', text: 'Move spice: up to 5 titanium for 5 M€ each'},
  {picture: 'coin', text: 'Black market: at double worth (6 M€ for 1 titanium)'},
  {sign: 'levels', text: 'Every deal raises the suspicion by 1'},
  {sign: 'shield', text: 'A bribe (10 M€, Industrial Center owner 7) lowers it by 1'},
  {sign: 'flag', text: 'End of generation: 0 and 1 are free, from 2 on TR is lost and the marker drops back to 0'},
  {sign: 'hidden', text: 'At 4 all trading stops until a bribe lowers it'},
];
