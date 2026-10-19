import {expect} from 'chai';
import fs from 'fs';
import path from 'path';
import {SCALE_CENTRE_X, SCALE_CENTRE_Y, SCALE_RADIUS, VEGETATION_ANGLES, WATER_ANGLES, scaleSteps} from '@/client/components/board/arrakisScales';

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
    expect(SCALE_CENTRE_X).eq(lessNumber(less, 'dial-cx'));
    expect(SCALE_CENTRE_Y).eq(lessNumber(less, 'dial-cy'));
    expect(SCALE_RADIUS).eq(lessNumber(less, 'dial-r'));
    expect(VEGETATION_ANGLES).deep.eq(lessAngles(less, 'oxygen-vals'));
    expect(WATER_ANGLES).deep.eq(lessAngles(less, 'temperature-vals'));
  });

  it('draws one closed step per value', () => {
    const steps = scaleSteps(VEGETATION_ANGLES);
    expect(steps).has.length(VEGETATION_ANGLES.length);
    expect(steps.every((step) => step.path.startsWith('M') && step.path.endsWith('Z'))).is.true;
  });
});
