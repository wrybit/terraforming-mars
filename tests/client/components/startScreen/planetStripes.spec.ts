import {expect} from 'chai';
import {PLANET_STRIPES, rotationLimits, STRIPES_TEXTURE_SIZE} from '@/client/components/startScreen/planetStripes';

describe('planetStripes', () => {
  it('keeps every stripe inside the texture', () => {
    for (const stripe of Object.values(PLANET_STRIPES)) {
      expect(stripe.top).to.be.at.least(0);
      expect(stripe.top + stripe.height).to.be.at.most(STRIPES_TEXTURE_SIZE.height);
      expect(stripe.startX).to.be.within(0, STRIPES_TEXTURE_SIZE.width);
    }
  });

  it('lets every planet rotate right from rest and never past the left texture end', () => {
    for (const stripe of Object.values(PLANET_STRIPES)) {
      const limits = rotationLimits(stripe);
      expect(limits.max).to.be.greaterThan(0);
      expect(limits.min).to.be.at.most(0);
      // linker Button-Rand bei voller Drehung bleibt rechts der runden Streifen-Enden
      const leftEdge = stripe.startX - limits.max * stripe.height / 90;
      expect(leftEdge).to.be.at.least(300);
    }
  });
});
