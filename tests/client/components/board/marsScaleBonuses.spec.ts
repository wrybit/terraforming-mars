import {expect} from 'chai';
import {scaleBonusPins} from '@/client/components/board/marsScaleBonuses';

describe('marsScaleBonuses', () => {
  it('places the temperature, oxygen and Venus bonuses and marks reached ones', () => {
    const pins = scaleBonusPins({temperature: -22, oxygen: 3, venus: 10});
    expect(pins.map((pin) => pin.key)).deep.eq(['temperature-24', 'temperature-20', 'temperature0', 'oxygen8', 'venus8', 'venus16']);
    expect(pins.filter((pin) => pin.done).map((pin) => pin.key)).deep.eq(['temperature-24', 'venus8']);
  });

  it('leaves out Venus without the expansion and puts chips outside the scale', () => {
    const pins = scaleBonusPins({temperature: -30, oxygen: 0, venus: undefined});
    expect(pins.some((pin) => pin.key.startsWith('venus'))).is.false;
    // Oxygen sits on the left: its chip is further left than the cell
    const oxygen = pins.find((pin) => pin.key === 'oxygen8')!;
    expect(oxygen.left).lessThan(20 + 13);
  });
});
