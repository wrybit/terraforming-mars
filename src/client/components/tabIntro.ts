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
  // Jede Feldauswahl bekommt wenigstens den Klick-Hinweis
  return option.type === 'space' ? {hint: 'click-space'} : undefined;
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
