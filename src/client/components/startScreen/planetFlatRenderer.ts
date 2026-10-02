/* Fallback without WebGL: the strip lies flat as a CSS background inside the globe circle (mask) and is shifted;
   a radial gradient darkens towards the edge so it still looks round. */
import {PlanetDrawRequest, PlanetRenderer} from './planetRenderer';
import {GLOBE, SPRITE_ROW, STRIPES_TEXTURE_SIZE, STRIPES_TEXTURE_URL, trimmedStripe} from './planetStripes';

export class PlanetFlatRenderer implements PlanetRenderer {
  public draw(request: PlanetDrawRequest): void {
    const {target, placement, offset, glow} = request;
    // without the edges: otherwise the divider and neighbouring strips flash through at the top/bottom
    const stripe = trimmedStripe(request.stripe);
    const width = target.clientWidth;
    const height = target.clientHeight;
    if (width === 0 || height === 0) {
      return;
    }
    // Sprite grid scaled uniformly like with WebGL (globeLayout.ts) so the arcs match up
    const {scale, spriteTop} = placement;
    const circle = `circle ${GLOBE.radius * scale}px at ${GLOBE.centerX * scale}px ${(GLOBE.centerY - spriteTop) * scale}px`;
    // Scale the strip so it fills the row height
    const textureScale = SPRITE_ROW.height * scale / stripe.height;
    const positionX = -stripe.startX * textureScale + offset * scale;
    const positionY = -stripe.top * textureScale;
    // On hover less darkening remains, like the flatter light in the WebGL renderer
    const darkness = 1 - 0.45 * glow;
    const shading = `radial-gradient(${circle}, transparent 45%, rgba(0, 0, 0, ${0.25 * darkness}) 70%, ` +
      `rgba(0, 0, 0, ${0.6 * darkness}) 90%, rgba(0, 0, 0, ${0.85 * darkness}) 100%)`;
    const mask = `radial-gradient(${circle}, #000 calc(100% - 1px), transparent 100%)`;
    target.style.backgroundImage = `${shading}, url(${STRIPES_TEXTURE_URL})`;
    target.style.backgroundRepeat = 'no-repeat';
    target.style.backgroundSize = `100% 100%, ${STRIPES_TEXTURE_SIZE.width * textureScale}px ${STRIPES_TEXTURE_SIZE.height * textureScale}px`;
    target.style.backgroundPosition = `0 0, ${positionX}px ${positionY}px`;
    target.style.maskImage = mask;
    target.style.setProperty('-webkit-mask-image', mask);
  }
}
