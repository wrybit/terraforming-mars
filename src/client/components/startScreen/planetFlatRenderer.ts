/* Ersatz ohne WebGL: der Streifen liegt flach als CSS-Hintergrund im Globus-Kreis (Maske) und wird verschoben;
   ein radialer Verlauf dunkelt zum Rand ab, damit er trotzdem rund wirkt. */
import {PlanetDrawRequest, PlanetRenderer} from './planetRenderer';
import {GLOBE, SPRITE_ROW, STRIPES_TEXTURE_SIZE, STRIPES_TEXTURE_URL} from './planetStripes';

export class PlanetFlatRenderer implements PlanetRenderer {
  public draw(request: PlanetDrawRequest): void {
    const {target, row, stripe, offset, glow} = request;
    const width = target.clientWidth;
    const height = target.clientHeight;
    if (width === 0 || height === 0) {
      return;
    }
    // Sprite-Raster auf Button-Breite; die Höhe wird wie bei WebGL mittig angeschnitten
    const scale = width / SPRITE_ROW.width;
    const verticalShift = (height - SPRITE_ROW.height * scale) / 2;
    const circle = `circle ${GLOBE.radius * scale}px at ${GLOBE.centerX * scale}px ` +
      `${(GLOBE.centerY - row * SPRITE_ROW.height) * scale + verticalShift}px`;
    // Streifen so skalieren, dass er die Reihenhöhe füllt
    const textureScale = SPRITE_ROW.height * scale / stripe.height;
    const positionX = -stripe.startX * textureScale + offset * scale;
    const positionY = -stripe.top * textureScale + verticalShift;
    // Beim Hover bleibt weniger Abdunklung, wie das flachere Licht im WebGL-Zeichner
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
