// Display data of a colony tile for the Colonies board tab and the trade tab: planet picture, tone,
// trade value with its icon, build/colony bonus texts. One source for both views.
import {ColonyModel} from '@/common/models/ColonyModel';
import {ColonyName} from '@/common/colonies/ColonyName';
import {ColonyBenefit} from '@/common/colonies/ColonyBenefit';
import {ColonyMetadata} from '@/common/colonies/ColonyMetadata';
import {Resource} from '@/common/Resource';
import {CardResource} from '@/common/CardResource';
import {getColonyOrThrow} from '@/client/colonies/ClientColonyManifest';

// Picture file per colony (assets/colonies-planets)
const PLANET_FILE: Record<ColonyName, string> = {
  [ColonyName.CALLISTO]: 'callisto.png',
  [ColonyName.CERES]: 'ceres.png',
  [ColonyName.ENCELADUS]: 'enceladus.png',
  [ColonyName.EUROPA]: 'europa.png',
  [ColonyName.GANYMEDE]: 'ganymede.jpg',
  [ColonyName.IO]: 'io.jpg',
  [ColonyName.LUNA]: 'luna.jpg',
  [ColonyName.MIRANDA]: 'miranda.jpg',
  [ColonyName.PLUTO]: 'pluto.jpg',
  [ColonyName.TITAN]: 'titan.jpg',
  [ColonyName.TRITON]: 'triton.jpg',
  [ColonyName.IAPETUS]: 'iapetus.jpg',
  [ColonyName.MERCURY]: 'mercury.jpg',
  [ColonyName.HYGIEA]: 'hygiea.jpg',
  [ColonyName.TITANIA]: 'titania.jpg',
  [ColonyName.VENUS]: 'venus.jpg',
  [ColonyName.LEAVITT]: 'leavitt.jpg',
  [ColonyName.PALLAS]: 'pallas.jpg',
  [ColonyName.DEIMOS]: 'deimos.jpg',
  [ColonyName.TERRA]: 'terra.jpg',
  [ColonyName.KUIPER]: 'kuiper.jpg',
  [ColonyName.LEAVITT_II]: 'leavitt.jpg',
  [ColonyName.IAPETUS_II]: 'iapetus.jpg',
};

// Where the disc lies in the photo (centre x/y and diameter as shares of the picture width/height), measured once:
// the photo is enlarged and moved so the disc fills the round frame exactly. Missing = whole picture.
const PLANET_FIT: Partial<Record<string, readonly [number, number, number, number]>> = {
  'callisto.png': [0.502, 0.498, 0.870, 0.870],
  'enceladus.png': [0.490, 0.497, 0.860, 0.860],
  'europa.png': [0.500, 0.500, 0.791, 0.791],
  'ganymede.jpg': [0.622, 0.497, 0.985, 0.985],
  'io.jpg': [0.618, 0.463, 0.876, 0.876],
  'luna.jpg': [0.518, 0.503, 0.830, 0.864],
  'mercury.jpg': [0.502, 0.501, 0.903, 0.932],
  'miranda.jpg': [0.514, 0.515, 0.868, 0.834],
  'pluto.jpg': [0.499, 0.489, 0.860, 0.860],
  'terra.jpg': [0.497, 0.503, 0.971, 0.966],
  'titan.jpg': [0.517, 0.489, 0.797, 0.857],
  'triton.jpg': [0.500, 0.506, 0.951, 0.951],
  'venus.jpg': [0.510, 0.498, 0.870, 0.870],
  'hygiea.jpg': [0.498, 0.514, 0.918, 0.872],
  'iapetus.jpg': [0.500, 0.500, 0.613, 0.817],
  'titania.jpg': [0.505, 0.498, 0.615, 0.819],
};

// Base colour per tile, like the art on the real colony tiles
const PLANET_TONE: Partial<Record<ColonyName, string>> = {
  [ColonyName.LUNA]: '#4f8fe0',
  [ColonyName.IO]: '#e08a2c',
  [ColonyName.PLUTO]: '#c79a82',
  [ColonyName.MIRANDA]: '#8f99a6',
  [ColonyName.TITAN]: '#d0a548',
  [ColonyName.GANYMEDE]: '#a98a6a',
  [ColonyName.EUROPA]: '#9fb7c9',
  [ColonyName.CALLISTO]: '#7d7468',
  [ColonyName.ENCELADUS]: '#cfe3ef',
  [ColonyName.TRITON]: '#c6b3a8',
  [ColonyName.CERES]: '#9a948c',
};
const DEFAULT_TONE = '#2fb0a8';

export type PlanetImage = {src: string, style: Record<string, string>};

export function planetImage(name: ColonyName): PlanetImage {
  const file = PLANET_FILE[name] ?? 'luna.jpg';
  const [cx, cy, dw, dh] = PLANET_FIT[file] ?? [0.5, 0.5, 1, 1];
  // 3 % zoomed in, so no dark edge of the photo stays inside the circle
  const width = 100 / (dw * 0.97);
  const height = 100 / (dh * 0.97);
  return {
    src: 'assets/colonies-planets/' + file,
    style: {
      width: width.toFixed(1) + '%',
      height: height.toFixed(1) + '%',
      left: (50 - cx * width).toFixed(1) + '%',
      top: (50 - cy * height).toFixed(1) + '%',
    },
  };
}

export function planetTone(name: ColonyName): string {
  return PLANET_TONE[name] ?? DEFAULT_TONE;
}

const RESOURCE_ICON: Record<Resource, string> = {
  [Resource.MEGACREDITS]: 'resources/megacredit.png',
  [Resource.STEEL]: 'resources/steel.png',
  [Resource.TITANIUM]: 'resources/titanium.png',
  [Resource.PLANTS]: 'resources/plant.png',
  [Resource.ENERGY]: 'resources/power.png',
  [Resource.HEAT]: 'resources/heat.png',
};

export function resourceIcon(resource: Resource): string {
  return RESOURCE_ICON[resource];
}

function cardResourceIcon(resource: CardResource | undefined): string {
  return resource === undefined ? 'resources/wild.png' : 'resources/' + resource.toLowerCase().replace(/ /g, '-') + '.png';
}

export type TradeIcon = {src: string, production: boolean};

// Icon of what a trade (or the colony bonus) gives
export function benefitIcon(metadata: ColonyMetadata, benefit: 'trade' | 'colony'): TradeIcon {
  const entry = metadata[benefit];
  const resource = Array.isArray(entry.resource) ? entry.resource[0] : entry.resource;
  switch (entry.type) {
  case ColonyBenefit.GAIN_RESOURCES:
  case ColonyBenefit.STEAL_RESOURCES:
    return {src: resource !== undefined ? resourceIcon(resource) : 'resources/wild.png', production: false};
  case ColonyBenefit.GAIN_PRODUCTION:
    return {src: resource !== undefined ? resourceIcon(resource) : 'resources/wild.png', production: true};
  case ColonyBenefit.ADD_RESOURCES_TO_CARD:
  case ColonyBenefit.ADD_RESOURCES_TO_VENUS_CARD:
    return {src: cardResourceIcon(metadata.cardResource), production: false};
  case ColonyBenefit.DRAW_CARDS:
  case ColonyBenefit.DRAW_CARDS_AND_BUY_ONE:
  case ColonyBenefit.DRAW_CARDS_AND_DISCARD_ONE:
  case ColonyBenefit.DRAW_CARDS_AND_KEEP_ONE:
  case ColonyBenefit.DRAW_EARTH_CARD:
    return {src: 'resources/card.png', production: false};
  case ColonyBenefit.GAIN_TR:
    return {src: 'resources/tr.png', production: false};
  case ColonyBenefit.INCREASE_VENUS_SCALE:
    return {src: 'global-parameters/venus.png', production: false};
  case ColonyBenefit.PLACE_DELEGATES:
  case ColonyBenefit.GAIN_INFLUENCE:
    return {src: 'misc/delegate.png', production: false};
  default:
    return {src: 'resources/wild.png', production: false};
  }
}

export type ColonyView = {
  model: ColonyModel;
  metadata: ColonyMetadata;
  planet: PlanetImage;
  tone: string;
  tradeValue: number;
  tradeIcon: TradeIcon;
  // Track values, the first three are the colony slots
  track: ReadonlyArray<number>;
  // After a trade the marker drops back to the number of colonies
  resetPosition: number;
  full: boolean;
};

export function colonyView(model: ColonyModel): ColonyView {
  const metadata = getColonyOrThrow(model.name);
  const track = metadata.trade.quantity;
  return {
    model,
    metadata,
    planet: planetImage(model.name),
    tone: planetTone(model.name),
    tradeValue: track[Math.min(model.trackPosition, track.length - 1)] ?? 0,
    tradeIcon: benefitIcon(metadata, 'trade'),
    track,
    resetPosition: Math.min(model.colonies.length, track.length - 1),
    full: model.colonies.length >= 3,
  };
}

// Best trade: free, active tiles; M€ first, then the highest value
export function bestTrade(colonies: ReadonlyArray<ColonyView>): ColonyView | undefined {
  return colonies
    .filter((colony) => colony.model.isActive && colony.model.visitor === undefined)
    .toSorted((a, b) => Number(b.tradeIcon.src === RESOURCE_ICON.megacredits) - Number(a.tradeIcon.src === RESOURCE_ICON.megacredits) || b.tradeValue - a.tradeValue)[0];
}
