import {Message} from '@/common/logs/Message';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {MAX_OCEAN_TILES, MAX_TEMPERATURE} from '@/common/constants';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {TileType} from '@/common/TileType';
import {PreviewTile, previewTileForSpaceInput} from '@/client/components/spaceTilePreview';
import {specialTileImage, TileImage, tileImage} from '@/client/components/specialTileImage';

// Erklärung oben in der Box eines Aktions-Tabs (OrOptions), wo sonst nur ein Button stünde:
// Bild (Plättchen oder Ressource), was passiert und Hinweiszeilen.
export type TabIntro = {
  tile?: TileImage; // Plättchen (Sechseck, bei Sonderplättchen mit Symbol darauf)
  resourceIcon?: string; // Ressourcen-Symbol (resources.less: resource_icon--<name>)
  hint?: 'click-space';
  facts?: ReadonlyArray<IntroFact>; // Spielstand-Zeilen, damit man die Folgen der Aktion ohne Suchen sieht
};

// Eine Spielstand-Zeile unter der Erklärung; Werte kommen erst beim Anzeigen aus dem Spielstand (introFacts)
export type IntroFact =
  {kind: 'temperature'} |
  {kind: 'heat', cost: number} |
  {kind: 'oceans'};

function heatConversion(cost: number): TabIntro {
  return {resourceIcon: 'heat', facts: [{kind: 'temperature'}, {kind: 'heat', cost}]};
}

const INTROS: Readonly<Record<string, TabIntro>> = {
  'Convert ${0} plants into greenery': {tile: tileImage(TileType.GREENERY), hint: 'click-space'},
  'Convert 8 heat into temperature': heatConversion(8),
  'Convert 6 heat into temperature': heatConversion(6),
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
  const tile = specialTileImage(option.title) ?? plainTile(option.title);
  // Beim Ozean zählt, wie viele schon liegen (Obergrenze, Ozean-Bonus auf Nachbarfeldern)
  if (previewTileForSpaceInput(option.title) === 'ocean') {
    return {tile, hint: 'click-space', facts: [{kind: 'oceans'}]};
  }
  return {tile, hint: 'click-space'};
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

function rawValues(...values: ReadonlyArray<number>): Message['data'] {
  return values.map((value) => ({type: LogMessageDataType.RAW_STRING, value: String(value)}));
}

// Textzeilen zu den Spielstand-Zeilen einer Erklärung
export function introFacts(intro: TabIntro, playerView: PlayerViewModel): Array<string | Message> {
  return (intro.facts ?? []).map((fact) => {
    switch (fact.kind) {
    case 'temperature':
      return temperatureHint(playerView.game.temperature);
    case 'heat': {
      const heat = playerView.thisPlayer.heat;
      return {message: 'Heat drops from ${0} to ${1}', data: rawValues(heat, Math.max(heat - fact.cost, 0))};
    }
    case 'oceans':
      return {message: '${0} of ${1} oceans are already on Mars', data: rawValues(playerView.game.oceans, MAX_OCEAN_TILES)};
    }
  });
}

// "Temperatur steigt von -28 °C auf -26 °C" bzw. Hinweis, dass sie schon am Maximum ist
function temperatureHint(currentTemperature: number): string | Message {
  if (currentTemperature >= MAX_TEMPERATURE) {
    return 'Temperature is already at maximum';
  }
  const next = Math.min(currentTemperature + TEMPERATURE_STEP, MAX_TEMPERATURE);
  return {
    message: 'Temperature rises from ${0} °C to ${1} °C',
    data: rawValues(currentTemperature, next),
  };
}
