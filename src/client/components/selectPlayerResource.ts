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

export function titleText(title: string | Message): string {
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

// "Do not remove M€", "Skip removing plants": name a resource but change nothing
export function isNoEffect(title: string | Message): boolean {
  return NO_EFFECT.test(titleText(title));
}

function titleDirection(text: string): 'gain' | 'loss' | undefined {
  const gain = GAIN_WORDS.test(text);
  const loss = LOSS_WORDS.test(text);
  if (gain === loss) {
    return undefined;
  }
  return gain ? 'gain' : 'loss';
}

// Number in the title: as a parameter (b.number → text parameter "4") or in the key ("up to 4 M€")
export function titleAmount(title: string | Message): number | undefined {
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
  if (isNoEffect(title)) {
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

// Title text with its text parameters filled in (English key), so resources and amounts given as
// parameters (e.g. "Spend ${0} ${1} …") are parsed like literal text. Card and player names stay
// placeholders: "Heat Trappers" must not count as heat
function filledTitleText(title: string | Message): string {
  if (typeof title === 'string') {
    return title;
  }
  return title.message.replace(/\$\{(\d+)\}/g, (placeholder, index) => {
    const datum = title.data[Number(index)];
    if (datum?.type === LogMessageDataType.STRING || datum?.type === LogMessageDataType.RAW_STRING) {
      return datum.value;
    }
    return placeholder;
  });
}

// Verbs that pay something: "Spend 1 plant …", "Pay 6 M€ …"
const COST_WORDS = /\b(spend|pay)\b/i;

function pieceDirection(text: string): 'gain' | 'loss' | undefined {
  if (COST_WORDS.test(text)) {
    return 'loss';
  }
  return titleDirection(text);
}

// All own resources an option changes, in title order: "Spend 1 plant to gain 7 M€" → plants −1, M€ +7.
// The title is split into the cost clause (before "to") and the result clause (after it); each clause
// into pieces at "and"/",". A piece without its own verb takes the verb of its clause
// ("gain 1 titanium and 2 M€"). Pieces without a standard resource (TR, floaters, Venus …) are left out.
export function playerEffects(title: string | Message): Array<PlayerEffect> {
  if (isNoEffect(title)) {
    return [];
  }
  const effects: Array<PlayerEffect> = [];
  for (const clause of filledTitleText(title).split(/\bto\b/i)) {
    const clauseDirection = pieceDirection(clause);
    for (const piece of clause.split(/\band\b|,/i)) {
      const resource = RESOURCE_WORDS.find(([pattern]) => pattern.test(piece))?.[1];
      if (resource === undefined) {
        continue;
      }
      const amount = /\b(\d+)\b/.exec(piece);
      effects.push({
        resource,
        target: /production/i.test(piece) ? 'production' : 'stock',
        direction: pieceDirection(piece) ?? clauseDirection,
        // "1 M€ per city" or "up to X" depend on the game state: no fixed number
        amount: amount === null || /\bper\b/i.test(piece) ? undefined : Number(amount[1]),
      });
    }
  }
  return effects;
}

// One row per resource with its state before and after all effects of the option on it
export type ResourceChange = {resource: Resource, before: ResourceSnapshot, after: ResourceSnapshot, direction?: 'gain' | 'loss'};

export function resourceChanges(player: PublicPlayerModel, effects: ReadonlyArray<PlayerEffect>): Array<ResourceChange> {
  const changes: Array<ResourceChange> = [];
  for (const effect of effects) {
    let change = changes.find((existing) => existing.resource === effect.resource);
    if (change === undefined) {
      const before = resourceSnapshot(player, effect.resource);
      change = {resource: effect.resource, before, after: before, direction: effect.direction};
      changes.push(change);
    }
    change.after = resourceAfter(change.after, effect);
  }
  return changes;
}
