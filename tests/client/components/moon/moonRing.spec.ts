import {expect} from 'chai';
import {RING_BOARD_SIZE, RING_CENTER, angleOf, ringCell, ringBand} from '@/client/components/moon/moonRing';

describe('moonRing', () => {
  it('puts the Moon in the middle of the square board', () => {
    expect(RING_CENTER[0]).eq(RING_BOARD_SIZE / 2);
    expect(RING_CENTER[1]).eq(RING_BOARD_SIZE / 2);
  });

  it('runs each rate along its arc and keeps numbers upright', () => {
    expect(angleOf('habitat', 0)).eq(122);
    expect(angleOf('habitat', 8)).eq(206);
    const cell = ringCell('logistic', 4);
    expect(Math.abs(cell.turn)).to.be.at.most(90);
    expect(ringBand('mining').cells).has.length(9);
  });
});
