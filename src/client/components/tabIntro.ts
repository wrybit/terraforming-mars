import {Message} from '@/common/logs/Message';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {MAX_TEMPERATURE} from '@/common/constants';

// Erklärung oben in der Box eines Aktions-Tabs (OrOptions), wo sonst nur ein Button stünde:
// Bild (Plättchen oder Ressource), was passiert und ein Hinweis.
export type TabIntro = {
  tileImage?: string; // Plättchen-Bild (assets/tiles/<name>.png)
  resourceIcon?: string; // Ressourcen-Symbol (resources.less: resource_icon--<name>)
  hint: 'click-space' | 'temperature';
};

const INTROS: Readonly<Record<string, TabIntro>> = {
  'Convert ${0} plants into greenery': {tileImage: 'assets/tiles/greenery.png', hint: 'click-space'},
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
  // Jede Feldauswahl bekommt den Klick-Hinweis, bei Ozean/Stadt/Grünfläche auch das Plättchen
  return option.type === 'space' ? {tileImage: spaceTileImage(key), hint: 'click-space'} : undefined;
}

// Plättchen einer Feldwahl, erkannt am englischen Titel-Schlüssel des Servers
// ("Select space for ocean tile", "Select space for city", "Select space for greenery tile" …)
const SPACE_TILES: ReadonlyArray<[RegExp, string]> = [
  [/\bocean\b/i, 'assets/tiles/ocean.png'],
  [/\bcity\b/i, 'assets/tiles/city.png'],
  [/\bgreenery\b/i, 'assets/tiles/greenery.png'],
];

export function spaceTileImage(titleKey: string): string | undefined {
  return SPACE_TILES.find(([pattern]) => pattern.test(titleKey))?.[1];
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
