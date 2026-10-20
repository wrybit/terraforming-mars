import {expect} from 'chai';
import {LARGE_SCALES, STANDARD_SCALES} from '@/client/components/board/arrakisScales';
import {bandBounds, gradientPieces, scaleArt, tangentRotation} from '@/client/components/board/arrakisScaleArt';
import {desync, particles, seededRandom} from '@/client/components/board/arrakisMotion';

const VEGETATION_LABELS = Array.from({length: 15}, (_, index) => String(index));

describe('arrakisScaleArt', () => {
  it('runs the gradient from the sand end to the top, so a half-full band is not yet green', () => {
    const angles = STANDARD_SCALES.vegetationAngles;
    const half = gradientPieces(STANDARD_SCALES, angles, angles[7], STANDARD_SCALES.radius);
    expect(half[0].share).lessThan(0.05);
    expect(half[half.length - 1].share).closeTo(0.5, 0.05);
    const whole = gradientPieces(STANDARD_SCALES, angles, bandBounds(angles).to, STANDARD_SCALES.radius);
    expect(whole[whole.length - 1].share).greaterThan(0.95);
  });

  it('shows every second number but not the current one, which sits in the capsule', () => {
    const art = scaleArt(STANDARD_SCALES, 'vegetation', STANDARD_SCALES.vegetationAngles, 4, VEGETATION_LABELS);
    expect(art.full).is.false;
    expect(art.numbers.map((mark) => mark.text)).deep.eq(['0', '2', '6', '8', '10', '12', '14']);
    expect(art.capsule?.text).eq('4');
    expect(art.dots.filter((dot) => dot.reached)).has.length(5);
    expect(art.check).is.undefined;
    // Particles flow in the fill: more of them the further it reaches
    expect(art.flow).has.length(10 + 4 * 2);
  });

  it('has no fill and no particles at the lowest value', () => {
    const art = scaleArt(STANDARD_SCALES, 'water', STANDARD_SCALES.waterAngles, 0, []);
    expect(art.fill).is.empty;
    expect(art.flow).is.empty;
    expect(art.capsule).is.not.undefined;
  });

  it('drops numbers, steps and capsule of a full band and shows the check in its middle', () => {
    const art = scaleArt(STANDARD_SCALES, 'vegetation', STANDARD_SCALES.vegetationAngles, 14, VEGETATION_LABELS);
    expect(art.full).is.true;
    expect(art.numbers).is.empty;
    expect(art.dots).is.empty;
    expect(art.capsule).is.undefined;
    expect(art.flow).has.length(46);
    const {from, to} = bandBounds(STANDARD_SCALES.vegetationAngles);
    const middle = (from + to) / 2 * Math.PI / 180;
    expect(art.check?.x).closeTo(STANDARD_SCALES.centreX + STANDARD_SCALES.radius * Math.cos(middle), 0.001);
  });

  it('keeps text upright on both sides of the planet', () => {
    expect(tangentRotation(180)).eq(0);
    expect(tangentRotation(30)).eq(30);
    expect(tangentRotation(-30)).eq(-30);
  });

  it('starts the large Arrakis scales far enough out for the spice fields between their low ends', () => {
    const vegetation = bandBounds(LARGE_SCALES.vegetationAngles).from;
    const water = bandBounds(LARGE_SCALES.waterAngles).from;
    // The row needs about 240 board px on the circle of the scales (arrakisSpiceFields.ts), plus room on both sides
    expect((vegetation - water) * Math.PI / 180 * LARGE_SCALES.radius).greaterThan(300);
  });

  it('starts both scales of both boards at the same height, so the spice row sits in the middle', () => {
    for (const geometry of [STANDARD_SCALES, LARGE_SCALES]) {
      expect(bandBounds(geometry.vegetationAngles).from).closeTo(180 - bandBounds(geometry.waterAngles).from, 0.15);
    }
  });
});

describe('arrakisMotion', () => {
  it('draws the same particles on every call', () => {
    const spread = {count: 3, spread: 4, minRadius: 1, radiusRange: 1, minTravel: 2, travelRange: 1, minBlink: 1, blinkRange: 1, maxColourShare: 0.9};
    expect(particles(7, spread)).deep.eq(particles(7, spread));
    expect(seededRandom(7)()).not.eq(seededRandom(13)());
  });

  it('gives vegetation and water storage their own pace and phase', () => {
    const vegetation = desync('vegetation-capsule', 2.4);
    const water = desync('water-capsule', 2.4);
    expect(vegetation).deep.eq(desync('vegetation-capsule', 2.4));
    expect(vegetation).not.deep.eq(water);
  });
});
