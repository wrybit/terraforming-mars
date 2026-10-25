import {expect} from 'chai';
import {cubeSpots, spotColumns} from '@/client/components/dune/trackCubeSpots';

describe('trackCubeSpots', () => {
  it('gives every cube a cell of its own, so cubes never overlap', () => {
    for (let count = 1; count <= 6; count++) {
      const keys = ['red', 'blue', 'green', 'yellow', 'black', 'purple'].slice(0, count);
      const spots = cubeSpots(keys, 'envy-3');
      const cells = new Set(spots.map((spot) => spot.row * spotColumns(count) + spot.column));
      expect(cells.size).eq(count);
      for (const spot of spots) {
        expect(spot.x).within(0, 1);
        expect(spot.y).within(0, 1);
      }
    }
  });

  it('keeps the same spots for the same step and players', () => {
    expect(cubeSpots(['red', 'blue'], 'envy-2')).deep.eq(cubeSpots(['red', 'blue'], 'envy-2'));
  });
});
