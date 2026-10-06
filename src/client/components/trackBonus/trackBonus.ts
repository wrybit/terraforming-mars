// One look for track bonuses on every board (Moon rates, planet tracks, Delta): a round chip next to the track,
// joined to its space by a single line. "own" = whoever moves the track there, "everyone" = all players (dashed),
// "done" = already handed out (grey, 50 %).
export type TrackBonusKind = 'own' | 'everyone' | 'done';

export type TrackBonus = {
  // Image path below assets/ (one or several = choice "A / B")
  icons: ReadonlyArray<string>;
  // Number in front of the icon (3 M€, 2 cards)
  count?: number;
  // Production box around the icon(s)
  production?: boolean;
  // Victory points instead of an icon
  victoryPoints?: number;
  // Text instead of an icon (↻ = use an action again)
  text?: string;
};

export const BONUS_ICON = {
  card: 'resources/card.png',
  heat: 'resources/heat.png',
  plant: 'resources/plant.png',
  floater: 'resources/floater.png',
  energy: 'resources/power.png',
  steel: 'resources/steel.png',
  titanium: 'resources/titanium.png',
  megacredits: 'resources/megacredit.png',
  tr: 'resources/tr.png',
  any: 'resources/wild.png',
  animal: 'resources/animal.png',
  delegate: 'misc/delegate.png',
  venus: 'global-parameters/venus.png',
  temperature: 'global-parameters/temperature.png',
  greenery: 'hex_green.png',
  city: 'tags/city.png',
  ocean: 'tiles/ocean.png',
} as const;
