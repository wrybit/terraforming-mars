import {Message} from '@/common/logs/Message';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {MAX_TEMPERATURE} from '@/common/constants';
import {TileType} from '@/common/TileType';
import {PreviewTile, previewTileForSpaceInput} from '@/client/components/spaceTilePreview';
import {specialTileImage, TileImage, tileImage} from '@/client/components/specialTileImage';

// Erklärung oben in der Box eines Aktions-Tabs (OrOptions), wo sonst nur ein Button stünde:
// Bild (Plättchen oder Ressource), was passiert und ein Hinweis.
export type TabIntro = {
  tile?: TileImage; // Plättchen (Sechseck, bei Sonderplättchen mit Symbol darauf)
  resourceIcon?: string; // Ressourcen-Symbol (resources.less: resource_icon--<name>)
  hint: 'click-space' | 'temperature';
};

const INTROS: Readonly<Record<string, TabIntro>> = {
  'Convert ${0} plants into greenery': {tile: tileImage(TileType.GREENERY), hint: 'click-space'},
  'Convert 8 heat into temperature': {resourceIcon: 'heat', hint: 'temperature'},
  'Convert 6 heat into temperature': {resourceIcon: 'heat', hint: 'temperature'},
};

// Ein Temperaturschritt sind 2 °C (Brett-Skala)
const TEMPERATURE_STEP = 2;

export function tabIntro(option: PlayerInputModel): TabIntro | undefined {
  const key = typeof option.title === 'string' ? option.title : option.title.message;
  const intro = INTROS[key];
  if (intro !== undefined) {
    return intro;
  }
  // Jede Feldauswahl bekommt den Klick-Hinweis, dazu das Plättchen: Sonderplättchen der Karte bzw. Vulkan,
  // sonst Ozean/Stadt/Grünfläche wie in der Vorschau auf dem Brett (spaceTilePreview.ts)
  if (option.type !== 'space') {
    return undefined;
  }
  return {tile: specialTileImage(option.title) ?? plainTile(option.title), hint: 'click-space'};
}

const PREVIEW_TILES: Readonly<Record<PreviewTile, TileType>> = {
  greenery: TileType.GREENERY,
  city: TileType.CITY,
  ocean: TileType.OCEAN,
};

function plainTile(title: string | Message): TileImage | undefined {
  const preview = previewTileForSpaceInput(title);
  return preview === undefined ? undefined : tileImage(PREVIEW_TILES[preview]);
}

// "Temperatur steigt von -28 °C auf -26 °C" bzw. Hinweis, dass sie schon am Maximum ist
export function temperatureHint(currentTemperature: number): string | Message {
  if (currentTemperature >= MAX_TEMPERATURE) {
    return 'Temperature is already at maximum';
  }
  const next = Math.min(currentTemperature + TEMPERATURE_STEP, MAX_TEMPERATURE);
  return {
    message: 'Temperature rises from ${0} °C to ${1} °C',
    data: [
      {type: LogMessageDataType.RAW_STRING, value: String(currentTemperature)},
      {type: LogMessageDataType.RAW_STRING, value: String(next)},
    ],
  };
}
