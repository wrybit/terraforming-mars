// Display data of a colony tile for the Colonies board tab and the trade tab: planet picture, tone,
// trade value with its icon, build/colony bonus texts. One source for both views.
import {ColonyModel} from '@/common/models/ColonyModel';
import {ColonyName} from '@/common/colonies/ColonyName';
import {ColonyBenefit} from '@/common/colonies/ColonyBenefit';
import {ColonyMetadata} from '@/common/colonies/ColonyMetadata';
import {Resource} from '@/common/Resource';
import {CardResource} from '@/common/CardResource';
import {getColonyOrThrow} from '@/client/colonies/ClientColonyManifest';

// Round planet picture per colony (assets/colonies-planets-round, built by scripts/make-colony-planets.py)
const PLANET_FILE: Record<ColonyName, string> = {
  [ColonyName.CALLISTO]: 'callisto',
  [ColonyName.CERES]: 'ceres',
  [ColonyName.ENCELADUS]: 'enceladus',
  [ColonyName.EUROPA]: 'europa',
  [ColonyName.GANYMEDE]: 'ganymede',
  [ColonyName.IO]: 'io',
  [ColonyName.LUNA]: 'luna',
  [ColonyName.MIRANDA]: 'miranda',
  [ColonyName.PLUTO]: 'pluto',
  [ColonyName.TITAN]: 'titan',
  [ColonyName.TRITON]: 'triton',
  [ColonyName.IAPETUS]: 'iapetus',
  [ColonyName.MERCURY]: 'mercury',
  [ColonyName.HYGIEA]: 'hygiea',
  [ColonyName.TITANIA]: 'titania',
  [ColonyName.VENUS]: 'venus',
  [ColonyName.LEAVITT]: 'leavitt',
  [ColonyName.PALLAS]: 'pallas',
  [ColonyName.DEIMOS]: 'deimos',
  [ColonyName.TERRA]: 'terra',
  [ColonyName.KUIPER]: 'kuiper',
  [ColonyName.LEAVITT_II]: 'leavitt',
  [ColonyName.IAPETUS_II]: 'iapetus',
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
  // Space station on a black photo: dark tile, so the photo's black background blends in
  [ColonyName.LEAVITT]: '#020306',
  [ColonyName.LEAVITT_II]: '#020306',
};
const DEFAULT_TONE = '#2fb0a8';

export type PlanetImage = {src: string, style: Record<string, string>};

export function planetImage(name: ColonyName): PlanetImage {
  // The pictures are already cropped square around the disc, so they simply fill the round frame
  return {
    src: 'assets/colonies-planets-round/' + (PLANET_FILE[name] ?? 'luna') + '.webp',
    style: {width: '100%', height: '100%', left: '0', top: '0'},
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

// Icon of what a trade (or the colony bonus) gives at a given track position
// (Europa names a different resource on every step)
export function benefitIcon(metadata: ColonyMetadata, benefit: 'trade' | 'colony', position: number = 0): TradeIcon {
  const entry = metadata[benefit];
  const resourceList = entry.resource;
  const resource = Array.isArray(resourceList) ? resourceList[Math.min(position, resourceList.length - 1)] : resourceList;
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
    tradeIcon: benefitIcon(metadata, 'trade', model.trackPosition),
    track,
    resetPosition: Math.min(model.colonies.length, track.length - 1),
    full: model.colonies.length >= 3,
  };
}

// What a trade actually gives this player: the server raises the colony track by the player's trade
// offset before trading (Trade Envoys, Trading Colony, L1 Trade Terminal). Titania (shouldIncreaseTrack
// 'no') never rises, and Europa ('ask') only rises if the player chooses so.
export type TradePreview = {
  value: number;
  baseValue: number;
  raised: number;
  optional: boolean;
  icon: TradeIcon;
};

export function tradePreview(view: ColonyView, offset: number): TradePreview {
  const lastPosition = view.track.length - 1;
  const raised = view.metadata.shouldIncreaseTrack === 'no' ?
    0 :
    Math.max(0, Math.min(offset, lastPosition - view.model.trackPosition));
  if (raised === 0) {
    return {value: view.tradeValue, baseValue: view.tradeValue, raised: 0, optional: false, icon: view.tradeIcon};
  }
  const position = view.model.trackPosition + raised;
  // The server skips the question when the resource does not change (Europa, Mercury, Hygiea)
  const resource = view.metadata.trade.resource;
  const sameResource = Array.isArray(resource) && resource[view.model.trackPosition] === resource[position];
  return {
    value: view.track[position] ?? view.tradeValue,
    baseValue: view.tradeValue,
    raised,
    optional: view.metadata.shouldIncreaseTrack === 'ask' && !sameResource,
    icon: benefitIcon(view.metadata, 'trade', position),
  };
}
