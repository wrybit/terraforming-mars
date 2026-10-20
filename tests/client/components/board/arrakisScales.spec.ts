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
    expect(STANDARD_SCALES.vegetationAngles).deep.eq(lessAngles(less, 'oxygen-vals'));
    expect(STANDARD_SCALES.waterAngles).deep.eq(lessAngles(less, 'temperature-vals'));
  });

  it('uses the large circle and the first marker angles of the large map for the large Arrakis', () => {
    expect(LARGE_SCALES.centreX).eq(lessNumber(less, 'dial-cx-large'));
    expect(LARGE_SCALES.centreY).eq(lessNumber(less, 'dial-cy-large'));
    expect(LARGE_SCALES.radius).eq(lessNumber(less, 'dial-r-large'));
    expect(LARGE_SCALES.vegetationAngles).deep.eq(lessAngles(less, 'oxygen-vals-large').slice(0, STANDARD_SCALES.vegetationAngles.length));
    expect(LARGE_SCALES.waterAngles).deep.eq(lessAngles(less, 'temperature-vals-large').slice(0, STANDARD_SCALES.waterAngles.length));
  });

  it('keeps symbol and name of the standard board where they were', () => {
    expect(scaleLabels(STANDARD_SCALES).vegetation).deep.eq({symbolAngle: 225, text: {from: 230, to: 262, anchor: 'start'}});
    const water = scaleLabels(STANDARD_SCALES).water;
    expect(water.symbolAngle).closeTo(-47, 0.001);
    expect(water.text.from).closeTo(-84, 0.001);
    expect(water.text.to).closeTo(-52, 0.001);
  });

  it('draws one closed step per value', () => {
    const steps = scaleSteps(STANDARD_SCALES, STANDARD_SCALES.vegetationAngles);
    expect(steps).has.length(STANDARD_SCALES.vegetationAngles.length);
    expect(steps.every((step) => step.path.startsWith('M') && step.path.endsWith('Z'))).is.true;
  });
});
