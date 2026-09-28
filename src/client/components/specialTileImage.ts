import {Message} from '@/common/logs/Message';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {CardName} from '@/common/cards/CardName';
import {TileType} from '@/common/TileType';
import {getCard} from '@/client/cards/ClientCardManifest';

// Bild eines Sonderplättchens für die Erklärung einer Feldwahl (tabIntro.ts, TabIntroBlock.vue):
// braunes Sonder-Sechseck mit dem Symbol der Karte darauf – wie auf den Karten selbst (cards_v2.less).
export type TileImage = {
  base: string; // Sechseck (assets/tiles/*.png)
  symbol?: string; // Symbol darauf (assets/tiles/special_tile_icons/*.png)
};

const SPECIAL_TILE_BASE = 'assets/tiles/special.png';
const SYMBOL_DIRECTORY = 'assets/tiles/special_tile_icons/';

const SYMBOLS: Readonly<Partial<Record<TileType, string>>> = {
  [TileType.BIOFERTILIZER_FACILITY]: 'biofertilizer_facility.png',
  [TileType.COMMERCIAL_DISTRICT]: 'commerical_district.png',
  [TileType.DEIMOS_DOWN]: 'deimos.png',
  [TileType.ECOLOGICAL_ZONE]: 'ecological_zone.png',
  [TileType.GREAT_DAM]: 'great_dam.png',
  [TileType.INDUSTRIAL_CENTER]: 'industrial_center.png',
  [TileType.LAVA_FLOWS]: 'lava_flows.png',
  [TileType.MAGNETIC_FIELD_GENERATORS]: 'magnetic_field_gen.png',
  [TileType.METALLIC_ASTEROID]: 'metallic_asteroid.png',
  [TileType.MINING_AREA]: 'mining_area.png',
  [TileType.MINING_RIGHTS]: 'mining_area.png',
  [TileType.MOHOLE_AREA]: 'mohole_area.png',
  [TileType.NATURAL_PRESERVE]: 'natural_preserve.png',
  [TileType.NUCLEAR_ZONE]: 'nuclear_zone.png',
  [TileType.OCEAN_CITY]: 'ocean_city.png',
  [TileType.OCEAN_FARM]: 'ocean_farm.png',
  [TileType.OCEAN_SANCTUARY]: 'ocean_sanctuary.png',
  [TileType.RESTRICTED_AREA]: 'restricted_area.png',
  [TileType.SOLAR_FARM]: 'solar_farm.png',
};

// Plättchen, die wie ein normales Plättchen aussehen
const PLAIN_TILES: Readonly<Partial<Record<TileType, string>>> = {
  [TileType.CAPITAL]: 'assets/tiles/city.png',
  [TileType.CITY]: 'assets/tiles/city.png',
  [TileType.OCEAN]: 'assets/tiles/ocean.png',
  [TileType.GREENERY]: 'assets/tiles/greenery.png',
};

export function tileImage(tile: TileType): TileImage {
  const plain = PLAIN_TILES[tile];
  if (plain !== undefined) {
    return {base: plain};
  }
  const symbol = SYMBOLS[tile];
  return {base: SPECIAL_TILE_BASE, symbol: symbol === undefined ? undefined : SYMBOL_DIRECTORY + symbol};
}

// Vulkanfelder (Lava Flows, Lava Tube Settlement): der Titel nennt die vier Vulkane, keine Karte
const VOLCANO_PATTERN = /Tharsis Tholus/;

// Erstes Plättchen im Kartenbild (metadata.renderData) – der Server nennt bei Sonderplättchen nur die Karte
function firstTileOnCard(node: unknown): TileType | undefined {
  if (node === null || typeof node !== 'object') {
    return undefined;
  }
  const item = node as {is?: string, tile?: TileType};
  if (item.is === 'tile' && item.tile !== undefined) {
    return item.tile;
  }
  for (const child of Object.values(node)) {
    const tile = firstTileOnCard(child);
    if (tile !== undefined) {
      return tile;
    }
  }
  return undefined;
}

// Sonderplättchen einer Feldwahl, erkannt an der Karte im Titel ("Select space for ${0} tile") oder den Vulkanen
export function specialTileImage(title: string | Message): TileImage | undefined {
  const key = typeof title === 'string' ? title : title.message;
  if (VOLCANO_PATTERN.test(key)) {
    return tileImage(TileType.LAVA_FLOWS);
  }
  if (typeof title === 'string') {
    return undefined;
  }
  const cardDatum = title.data.find((datum) => datum.type === LogMessageDataType.CARD);
  if (cardDatum === undefined) {
    return undefined;
  }
  const tile = firstTileOnCard(getCard(cardDatum.value as CardName)?.metadata.renderData);
  return tile === undefined ? undefined : tileImage(tile);
}
