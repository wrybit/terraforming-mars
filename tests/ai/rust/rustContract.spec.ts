import {expect} from 'chai';
import {responseFor} from '../../../src/server/ai/rust/rustContract';

describe('rustContract', () => {
  const buyChain = [
    {kind: 'cards', cards: ['Pets', 'Insects']},
    {kind: 'payment', payment: {megacredits: 3, heat: 3}},
  ];

  it('answers the card question of buying cards with the cards', () => {
    expect(responseFor({type: 'card', title: 'Select card(s) to buy'}, buyChain)).deep.eq({type: 'card', cards: ['Pets', 'Insects']});
  });

  it('answers the payment question of buying cards with the payment, not the cards', () => {
    const response = responseFor({type: 'payment', title: 'Select how to spend 6 M€ for 2 cards'}, buyChain);
    expect(response.type).eq('payment');
    expect(response.payment.megacredits).eq(3);
    expect(response.payment.heat).eq(3);
  });

  it('puts the wild resource of the alternative Venus board on the card the bot names', () => {
    const wild = {type: 'or', title: 'Choose your wild resource bonus.', options: [
      {type: 'card', title: 'Add resource to card'}, {type: 'and', title: 'Gain 1 resource(s) for your Venus track bonus.', options: []}]};
    expect(responseFor(wild, [{kind: 'index', index: 0, cards: ['Birds']}])).deep.eq({type: 'or', index: 0, response: {type: 'card', cards: ['Birds']}});
  });

  it('answers parts the bot decides one after the other but TS asks together (Focused Organization)', () => {
    const input = {type: 'and', title: '', options: [{type: 'resource', title: 'Gain'}, {type: 'card', title: 'Discard'}]};
    const chain = [{kind: 'cards', cards: ['Pets']}, {kind: 'resource', resource: 'plants'}];
    expect(responseFor(input, chain)).deep.eq({type: 'and', responses: [{type: 'resource', resource: 'plants'}, {type: 'card', cards: ['Pets']}]});
  });
});
