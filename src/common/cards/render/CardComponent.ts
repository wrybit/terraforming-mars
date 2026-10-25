export type ComponentType =
  'root' |
  'production-box' |
  'effect' |
  'corp-box-effect' |
  'corp-box-action' |
  'corp-box-effect-action' |
  'symbol' |
  'item' |
  'tile' |
  // Dune: the envy track with the steps a card hits (client/components/dune/CardEnvyTrack.vue)
  'envy-track';

export interface CardComponent {
  is: ComponentType;
}
