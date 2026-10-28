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
    expect(vegetation.symbolAngle).closeTo(230.69, 0.01);
    expect(vegetation.text.from).closeTo(234.98, 0.01);
    expect(vegetation.text.to).closeTo(264.98, 0.01);
    const water = scaleLabels(STANDARD_SCALES).water;
    expect(water.symbolAngle).closeTo(-55.69, 0.01);
    expect(water.text.from).closeTo(-89.98, 0.01);
    expect(water.text.to).closeTo(-59.98, 0.01);
  });

  // Gaps in board pixels from the end of the band, the same on both boards and both sides (design B · eng)
  for (const [name, geometry] of [['standard', STANDARD_SCALES], ['large', LARGE_SCALES]] as const) {
    it(`keeps the same pixel gaps between band, symbol and name on the ${name} board`, () => {
      const pixels = (degrees: number) => Math.abs(degrees) * Math.PI / 180 * geometry.radius;
      const {vegetation, water} = scaleLabels(geometry);
      const vegetationEnd = 2 * geometry.vegetationAngles.at(-1)! - (geometry.vegetationAngles.at(-1)! + geometry.vegetationAngles.at(-2)!) / 2;
      const waterEnd = 2 * geometry.waterAngles.at(-1)! - (geometry.waterAngles.at(-1)! + geometry.waterAngles.at(-2)!) / 2;
      expect(pixels(vegetation.symbolAngle - vegetationEnd)).closeTo(31, 0.01);
      expect(pixels(water.symbolAngle - waterEnd)).closeTo(31, 0.01);
      expect(pixels(vegetation.text.from - vegetationEnd)).closeTo(51, 0.01);
      expect(pixels(water.text.to - waterEnd)).closeTo(51, 0.01);
    });
  }

  it('draws one closed step per value', () => {
    const steps = scaleSteps(STANDARD_SCALES, STANDARD_SCALES.vegetationAngles);
    expect(steps).has.length(STANDARD_SCALES.vegetationAngles.length);
    expect(steps.every((step) => step.path.startsWith('M') && step.path.endsWith('Z'))).is.true;
  });
});
