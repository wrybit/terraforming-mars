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
});
