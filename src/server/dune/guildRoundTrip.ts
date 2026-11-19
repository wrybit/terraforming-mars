import {PlayerId} from '../../common/Types';
import {Resource} from '../../common/Resource';
import {EXCHANGE_GOODS, ExchangeGood} from '../../common/dune/smugglingExchange';

// Since selling may stand above buying the same good (Jens 27 Oct 2026, variant G of
// _mockups/dune/choam/kurs-dynamik.html), buying cheap and selling dear at the guild would print money. So a good a
// player bought from the guild cannot be sold to it, and the other way round: in the same generation and, since guild
// variant D (Jens 19 Nov 2026), in the next one too, because the AI bought cheap in one generation and sold dear in the
// next. Energy and heat count as one good here: energy turns into heat at the end of the generation, so cheap energy
// was sold as dear heat.
// The record knows its generation and keeps the one before; older entries drop out without being reset.

type Entries = Record<PlayerId, {sold: Array<ExchangeGood>, bought: Array<ExchangeGood>}>;

export type GuildRoundTrips = {
  generation: number,
  /** Goods each player sold to and bought from the guild in that generation */
  players: Entries,
  /** The same for the generation before (missing in games from before guild variant D) */
  previous?: {generation: number, players: Entries},
};

function isExchangeGood(resource: Resource): resource is ExchangeGood {
  return (EXCHANGE_GOODS as ReadonlyArray<Resource>).includes(resource);
}

/** Energy and heat are one good for the round trip */
function sameGood(first: Resource, second: Resource): boolean {
  const family = (resource: Resource) => resource === Resource.HEAT ? Resource.ENERGY : resource;
  return family(first) === family(second);
}

/** The entries of `player` in this and the previous generation */
function entriesOf(record: GuildRoundTrips | undefined, player: PlayerId, generation: number) {
  if (record === undefined) {
    return [];
  }
  const entries = [];
  if (record.generation === generation) {
    entries.push(record.players[player]);
    if (record.previous?.generation === generation - 1) {
      entries.push(record.previous.players[player]);
    }
  } else if (record.generation === generation - 1) {
    entries.push(record.players[player]);
  }
  return entries.filter((entry) => entry !== undefined);
}

/** The record after a guild trade of `player`: what was given counts as sold, what was got as bought */
export function recordRoundTrip(record: GuildRoundTrips | undefined, player: PlayerId, generation: number, give: Resource, get: Resource): GuildRoundTrips {
  // The first trade of a new generation: the old record becomes `previous` if it is exactly one generation old
  const current: GuildRoundTrips = record?.generation === generation ? record : {
    generation,
    players: {},
    previous: record?.generation === generation - 1 ? {generation: record.generation, players: record.players} : undefined,
  };
  const entry = current.players[player] ?? {sold: [], bought: []};
  const sold = isExchangeGood(give) && !entry.sold.includes(give) ? [...entry.sold, give] : entry.sold;
  const bought = isExchangeGood(get) && !entry.bought.includes(get) ? [...entry.bought, get] : entry.bought;
  const next: GuildRoundTrips = {generation, players: {...current.players, [player]: {sold, bought}}};
  if (current.previous !== undefined) {
    next.previous = current.previous;
  }
  return next;
}

/** Whether `player` may sell `resource` to the guild now (not bought from it this or last generation) */
export function maySellToGuild(record: GuildRoundTrips | undefined, player: PlayerId, generation: number, resource: Resource): boolean {
  return !isExchangeGood(resource) ||
    !entriesOf(record, player, generation).some((entry) => entry.bought.some((good) => sameGood(good, resource)));
}

/** Whether `player` may buy `resource` from the guild now (not sold to it this or last generation) */
export function mayBuyFromGuild(record: GuildRoundTrips | undefined, player: PlayerId, generation: number, resource: Resource): boolean {
  return !isExchangeGood(resource) ||
    !entriesOf(record, player, generation).some((entry) => entry.sold.some((good) => sameGood(good, resource)));
}
