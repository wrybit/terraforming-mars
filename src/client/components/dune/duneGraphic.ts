// Pictures of the Dune theme (assets/themes/dune/graphics/<name>.svg). The Dune expansion only exists with the
// Dune theme, so its panels use them directly instead of going through themedAsset.
export function duneGraphic(name: string): string {
  return `assets/themes/dune/graphics/${name}.svg`;
}
