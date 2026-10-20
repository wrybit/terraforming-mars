import {expect} from 'chai';
import fs from 'fs';
import path from 'path';
import {LARGE_SCALES, STANDARD_SCALES, scaleLabels, scaleSteps} from '@/client/components/board/arrakisScales';

// The vector scales of Arrakis lie behind the markers that globs.less pins: both must use the same circle and angles
function lessAngles(less: string, list: string): Array<number> {
  const block = less.split(`@${list}:`)[1].split(';')[0];
  return [...block.matchAll(/-?\d+\s+(-?[\d.]+)deg/g)].map((match) => Number(match[1]));
}

function lessNumber(less: string, name: string): number {
  return Number(less.split(`@${name}:`)[1].split('px')[0]);
}

describe('arrakisScales', () => {
  const less = fs.readFileSync(path.resolve(__dirname, '../../../../src/styles/globs.less'), 'utf8');

  it('uses the circle and the marker angles of globs.less', () => {
    expect(STANDARD_SCALES.centreX).eq(lessNumber(less, 'dial-cx'));
    expect(STANDARD_SCALES.centreY).eq(lessNumber(less, 'dial-cy'));
    expect(STANDARD_SCALES.radius).eq(lessNumber(less, 'dial-r'));
    expect(STANDARD_SCALES.vegetationAngles).deep.eq(lessAngles(less, 'oxygen-vals-arrakis'));
    expect(STANDARD_SCALES.waterAngles).deep.eq(lessAngles(less, 'temperature-vals-arrakis'));
  });

  it('uses the large circle and its own marker angles for the large Arrakis', () => {
    expect(LARGE_SCALES.centreX).eq(lessNumber(less, 'dial-cx-large'));
    expect(LARGE_SCALES.centreY).eq(lessNumber(less, 'dial-cy-large'));
    expect(LARGE_SCALES.radius).eq(lessNumber(less, 'dial-r-large'));
    expect(LARGE_SCALES.vegetationAngles).deep.eq(lessAngles(less, 'oxygen-vals-arrakis-91'));
    expect(LARGE_SCALES.waterAngles).deep.eq(lessAngles(less, 'temperature-vals-arrakis-91'));
  });

  it('turns symbol and name of the standard board up with its scales, the names meeting at the top', () => {
    const vegetation = scaleLabels(STANDARD_SCALES).vegetation;
    expect(vegetation.symbolAngle).closeTo(229.4, 0.001);
    expect(vegetation.text.from).closeTo(234.4, 0.001);
    expect(vegetation.text.to).closeTo(266.4, 0.001);
    const water = scaleLabels(STANDARD_SCALES).water;
    expect(water.symbolAngle).closeTo(-54, 0.001);
    expect(water.text.from).closeTo(-91, 0.001);
    expect(water.text.to).closeTo(-59, 0.001);
  });

  it('draws one closed step per value', () => {
    const steps = scaleSteps(STANDARD_SCALES, STANDARD_SCALES.vegetationAngles);
    expect(steps).has.length(STANDARD_SCALES.vegetationAngles.length);
    expect(steps.every((step) => step.path.startsWith('M') && step.path.endsWith('Z'))).is.true;
  });
});
