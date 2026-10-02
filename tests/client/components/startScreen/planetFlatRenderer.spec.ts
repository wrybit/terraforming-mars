import {expect} from 'chai';
import {PlanetFlatRenderer} from '@/client/components/startScreen/planetFlatRenderer';
import {PLANET_STRIPES, STRIPES_TEXTURE_URL} from '@/client/components/startScreen/planetStripes';

function canvasOfSize(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'clientWidth', {value: width});
  Object.defineProperty(canvas, 'clientHeight', {value: height});
  return canvas;
}

describe('PlanetFlatRenderer', () => {
  it('shows the stripe as background and moves it right when rotated', () => {
    const renderer = new PlanetFlatRenderer();
    const target = canvasOfSize(369, 90);
    renderer.draw({target, placement: {scale: 1, spriteTop: 270}, stripe: PLANET_STRIPES.mars, offset: 0, glow: 0});
    expect(target.style.backgroundImage).to.include(STRIPES_TEXTURE_URL);
    const restX = parseFloat(target.style.backgroundPosition.split(',')[1]);
    renderer.draw({target, placement: {scale: 1, spriteTop: 270}, stripe: PLANET_STRIPES.mars, offset: 100, glow: 1});
    const rotatedX = parseFloat(target.style.backgroundPosition.split(',')[1]);
    expect(rotatedX - restX).to.be.closeTo(100, 0.01);
  });

  it('draws nothing while the button has no size yet', () => {
    const target = canvasOfSize(0, 0);
    new PlanetFlatRenderer().draw({target, placement: {scale: 1, spriteTop: 90}, stripe: PLANET_STRIPES.venus, offset: 0, glow: 0});
    expect(target.style.backgroundImage).eq('');
  });
});
