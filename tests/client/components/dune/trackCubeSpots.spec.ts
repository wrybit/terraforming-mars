import {expect} from 'chai';
import {GRID_COLUMNS, cubeSpots, gridRows} from '@/client/components/dune/trackCubeSpots';

describe('trackCubeSpots', () => {
  it('gives every cube a slot in the row and a cell in the grid of its own, so cubes never overlap', () => {
    for (let count = 1; count <= 6; count++) {
      const keys = ['red', 'blue', 'green', 'yellow', 'black', 'purple'].slice(0, count);
      const spots = cubeSpots(keys, 'envy-3');
      expect(new Set(spots.map((spot) => spot.slot)).size).eq(count);
      expect(new Set(spots.map((spot) => spot.row * GRID_COLUMNS + spot.column)).size).eq(count);
      expect(Math.max(...spots.map((spot) => spot.row))).lt(gridRows(count));
      // Further right in the row: never less free width before it
      const bySlot = [...spots].sort((a, b) => a.slot - b.slot);
      for (let index = 1; index < bySlot.length; index++) {
        expect(bySlot[index].shift).gte(bySlot[index - 1].shift);
      }
    }
  });

  it('keeps the same spots for the same step and players', () => {
    expect(cubeSpots(['red', 'blue'], 'envy-2')).deep.eq(cubeSpots(['red', 'blue'], 'envy-2'));
  });
});
