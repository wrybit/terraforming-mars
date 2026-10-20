import {expect} from 'chai';
import {scaleBonusPins} from '@/client/components/board/marsScaleBonuses';
import {LARGE_SCALES} from '@/client/components/board/arrakisScales';

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

  it('pins the large Arrakis bonuses on the large circle at the cells of their values', () => {
    const pin = scaleBonusPins({temperature: -30, oxygen: 0, venus: undefined}, LARGE_SCALES).find((p) => p.key === 'oxygen8');
    const radians = LARGE_SCALES.vegetationAngles[8] * Math.PI / 180;
    const cellX = LARGE_SCALES.centreX + LARGE_SCALES.radius * Math.cos(radians);
    const cellY = LARGE_SCALES.centreY + LARGE_SCALES.radius * Math.sin(radians);
    // The connector tip lies just outside the cell, away from the planet
    expect(Math.hypot((pin?.left ?? 0) - cellX, (pin?.top ?? 0) - cellY)).closeTo(16, 0.01);
    expect(Math.hypot((pin?.left ?? 0) - LARGE_SCALES.centreX, (pin?.top ?? 0) - LARGE_SCALES.centreY)).greaterThan(LARGE_SCALES.radius);
  });
});
