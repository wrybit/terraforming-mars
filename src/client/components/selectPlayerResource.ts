import {Message} from '@/common/logs/Message';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {ALL_RESOURCES, Resource} from '@/common/Resource';
import {PublicPlayerModel} from '@/common/models/PlayerModel';

// Ressourcen-Wörter in englischen Titel-Schlüsseln ohne Parameter (z. B. "Select player to remove up to 4 M€ from")
// und in Text-Parametern (Sabotage schreibt "M€" statt "megacredits")
const RESOURCE_WORDS: ReadonlyArray<[RegExp, Resource]> = [
  [/M€/, Resource.MEGACREDITS],
  [/\bmegacredits?\b/i, Resource.MEGACREDITS], // Robinson Industries: "Increase megacredits production 1 step"
  [/\bsteel\b/i, Resource.STEEL],
  [/\btitanium\b/i, Resource.TITANIUM],
  [/\bplants?\b/i, Resource.PLANTS],
  [/\benergy\b/i, Resource.ENERGY],
  [/\bheat\b/i, Resource.HEAT],
];

function titleText(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

function resourceInWord(text: string): Resource | undefined {
  if ((ALL_RESOURCES as ReadonlyArray<string>).includes(text)) {
    return text as Resource;
  }
  return RESOURCE_WORDS.find(([pattern]) => pattern.test(text))?.[1];
}

// Um welche Ressource es bei einer Spielerwahl geht (z. B. "Stahl-Produktion senken", "Pflanzen stehlen"),
// damit die Spieler-Kacheln (PlayerOptionTile.vue) Bestand und Produktion genau dieser Ressource zeigen.
// Meist schreibt der Server die Ressource als Parameter in den Titel (DecreaseAnyProduction, StealResources, Sabotage …),
// manche Karten nennen sie nur im Text (CometForVenus, RemoveAnyPlants) – dann zählt das Wort im Titel-Schlüssel.
export function selectPlayerResource(title: string | Message): Resource | undefined {
  if (typeof title !== 'string') {
    for (const datum of title.data) {
      if (datum.type === LogMessageDataType.STRING || datum.type === LogMessageDataType.RAW_STRING) {
        const resource = resourceInWord(datum.value);
        if (resource !== undefined) {
          return resource;
        }
      }
    }
  }
  return RESOURCE_WORDS.find(([pattern]) => pattern.test(titleText(title)))?.[1];
}

// Was eine Wahl beim betroffenen Spieler verändert: welche Ressource, ob Vorrat oder Produktion, in welche
// Richtung und um wie viel. amount oder direction fehlen, wenn der Titel es nicht eindeutig sagt –
// dann zeigt die Kachel nur den aktuellen Stand.
export type PlayerEffect = {
  resource: Resource,
  target: 'stock' | 'production',
  direction?: 'gain' | 'loss',
  amount?: number,
};

// Verben im englischen Titel-Schlüssel; nennt ein Titel beide (z. B. "Remove microbes to gain M€"),
// bleibt die Richtung offen, weil sich das Entfernen auf etwas anderes beziehen kann
const GAIN_WORDS = /\b(increase|gain|add|raise)\b/i;
const LOSS_WORDS = /\b(remove|steal|decrease|lose|reduce)\b/i;

const NO_EFFECT = /^(do not|don't|skip)\b/i;

function titleDirection(text: string): 'gain' | 'loss' | undefined {
  const gain = GAIN_WORDS.test(text);
  const loss = LOSS_WORDS.test(text);
  if (gain === loss) {
    return undefined;
  }
  return gain ? 'gain' : 'loss';
}

// Zahl im Titel: als Parameter (b.number → Text-Parameter "4") oder im Schlüssel ("up to 4 M€")
function titleAmount(title: string | Message): number | undefined {
  if (typeof title !== 'string') {
    for (const datum of title.data) {
      if (datum.type === LogMessageDataType.RAW_STRING && /^\d+$/.test(datum.value)) {
        return Number(datum.value);
      }
    }
  }
  // Platzhalter wie ${0} zählen nicht als Zahl
  const match = /\b(\d+)\b/.exec(titleText(title).replace(/\$\{\d+\}/g, ''));
  return match === null ? undefined : Number(match[1]);
}

// Wirkung einer Wahl auf den betroffenen Spieler (Angriff auf einen Gegner, eigene Produktion erhöhen …);
// undefined, wenn keine Ressource erkennbar ist
export function playerEffect(title: string | Message): PlayerEffect | undefined {
  // "Entferne keine M€", "Skip removing plants": nennen die Ressource, ändern aber nichts
  if (NO_EFFECT.test(titleText(title))) {
    return undefined;
  }
  const resource = selectPlayerResource(title);
  if (resource === undefined) {
    return undefined;
  }
  return {
    resource,
    target: /production/i.test(titleText(title)) ? 'production' : 'stock',
    direction: titleDirection(titleText(title)),
    amount: titleAmount(title),
  };
}

export type ResourceSnapshot = {stock: number, production: number};

// Bestand und Produktion eines Spielers für eine Ressource
export function resourceSnapshot(player: PublicPlayerModel, resource: Resource): ResourceSnapshot {
  switch (resource) {
  case 'megacredits': return {stock: player.megacredits, production: player.megacreditProduction};
  case 'steel': return {stock: player.steel, production: player.steelProduction};
  case 'titanium': return {stock: player.titanium, production: player.titaniumProduction};
  case 'plants': return {stock: player.plants, production: player.plantProduction};
  case 'energy': return {stock: player.energy, production: player.energyProduction};
  case 'heat': return {stock: player.heat, production: player.heatProduction};
  }
}

// Stand nach der Wahl: ein Verlust senkt den Vorrat höchstens auf 0 (der Server nimmt nur, was da ist),
// die Produktion um die volle Zahl; ein Gewinn erhöht um die Zahl
export function resourceAfter(snapshot: ResourceSnapshot, effect: PlayerEffect): ResourceSnapshot {
  if (effect.amount === undefined || effect.direction === undefined) {
    return snapshot;
  }
  const change = effect.direction === 'gain' ? effect.amount : -effect.amount;
  if (effect.target === 'production') {
    return {...snapshot, production: snapshot.production + change};
  }
  return {...snapshot, stock: Math.max(0, snapshot.stock + change)};
}
