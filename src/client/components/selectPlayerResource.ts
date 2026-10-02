import {Message} from '@/common/logs/Message';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {ALL_RESOURCES, Resource} from '@/common/Resource';
import {PublicPlayerModel} from '@/common/models/PlayerModel';

// Resource words in English title keys without parameters (e.g. "Select player to remove up to 4 M€ from")
// and in text parameters (Sabotage writes "M€" instead of "megacredits")
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

// Which resource a player selection is about (e.g. "decrease steel production", "steal plants"),
// so the player tiles (PlayerOptionTile.vue) show stock and production of exactly this resource.
// Usually the server puts the resource as a parameter in the title (DecreaseAnyProduction, StealResources, Sabotage …),
// some cards only name it in the text (CometForVenus, RemoveAnyPlants) – then the word in the title key counts.
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

// What a selection changes for the affected player: which resource, stock or production, in which
// direction and by how much. amount or direction are missing if the title does not say so unambiguously –
// then the tile only shows the current state.
export type PlayerEffect = {
  resource: Resource,
  target: 'stock' | 'production',
  direction?: 'gain' | 'loss',
  amount?: number,
};

// Verbs in the English title key; if a title names both (e.g. "Remove microbes to gain M€"),
// the direction stays open because the removal can refer to something else
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

// Number in the title: as a parameter (b.number → text parameter "4") or in the key ("up to 4 M€")
function titleAmount(title: string | Message): number | undefined {
  if (typeof title !== 'string') {
    for (const datum of title.data) {
      if (datum.type === LogMessageDataType.RAW_STRING && /^\d+$/.test(datum.value)) {
        return Number(datum.value);
      }
    }
  }
  // Placeholders like ${0} do not count as a number
  const match = /\b(\d+)\b/.exec(titleText(title).replace(/\$\{\d+\}/g, ''));
  return match === null ? undefined : Number(match[1]);
}

// Effect of a selection on the affected player (attack on an opponent, raise own production …);
// undefined if no resource can be identified
export function playerEffect(title: string | Message): PlayerEffect | undefined {
  // "Do not remove M€", "Skip removing plants": name the resource but change nothing
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

// Stock and production of a player for one resource
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

// State after the selection: a loss lowers the stock to 0 at most (the server only takes what is there),
// production by the full number; a gain raises it by the number
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
