import {expect} from 'chai';
import {CellLookup, scaleBonusPins} from '@/client/components/board/marsScaleBonuses';
import {BoardName} from '@/common/boards/BoardName';

// Stand-in for the rendered scale cells: oxygen on the left, temperature on the right, Venus on top
const cell: CellLookup = (scale, value) => {
  switch (scale) {
  case 'oxygen': return [300 - value * 10, 20];
  case 'temperature': return [300 + value * 5, 560];
  case 'venus': return [20, 200 + value * 5];
  }
};

describe('marsScaleBonuses', () => {
  it('places the temperature, oxygen and Venus bonuses and marks reached ones', () => {
    const pins = scaleBonusPins({values: {temperature: -22, oxygen: 3, venus: 10}, boardName: BoardName.THARSIS, large: false, cell});
    expect(pins.map((pin) => pin.key)).deep.eq(['temperature-24', 'temperature-20', 'temperature0', 'oxygen8', 'venus8', 'venus16']);
    expect(pins.filter((pin) => pin.done).map((pin) => pin.key)).deep.eq(['temperature-24', 'venus8']);
  });

  it('uses the bonuses of the map (Amazonis Planitia)', () => {
    const pins = scaleBonusPins({values: {temperature: -30, oxygen: 0, venus: 0}, boardName: BoardName.AMAZONIS_PLANITIA, large: true, cell});
    expect(pins.map((pin) => pin.key)).deep.eq([
      'temperature-24', 'temperature-20', 'temperature-12', 'temperature0', 'oxygen7', 'oxygen11', 'venus8', 'venus16', 'venus22']);
  });

  it('leaves out Venus without the expansion and puts chips outside the scale', () => {
    const pins = scaleBonusPins({values: {temperature: -30, oxygen: 0, venus: undefined}, boardName: BoardName.THARSIS, large: false, cell});
    expect(pins.some((pin) => pin.key.startsWith('venus'))).is.false;
    // Oxygen sits on the left: its chip is further left than the cell
    const oxygen = pins.find((pin) => pin.key === 'oxygen8')!;
    expect(oxygen.left).lessThan(20 + 13);
  });

  it('skips bonuses whose cell is not rendered', () => {
    const pins = scaleBonusPins({values: {temperature: -30, oxygen: 0}, boardName: BoardName.THARSIS, large: false, cell: () => undefined});
    expect(pins).is.empty;
  });
});
