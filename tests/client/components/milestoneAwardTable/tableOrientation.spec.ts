import {expect} from 'chai';
import {prefersTransposed} from '@/client/components/milestoneAwardTable/tableOrientation';

describe('tableOrientation', () => {
  it('keeps the horizontal table when every value column gets a comfortable width', () => {
    expect(prefersTransposed(800, 10)).is.false;
  });

  it('transposes when the box is too narrow for the value columns', () => {
    expect(prefersTransposed(470, 10)).is.true;
  });

  it('needs less width for fewer columns', () => {
    expect(prefersTransposed(470, 8)).is.false;
  });

  it('keeps the horizontal table while the box is not laid out yet', () => {
    expect(prefersTransposed(0, 10)).is.false;
  });
});
