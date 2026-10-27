import {PlayerId} from '../../common/Types';
import {Resource} from '../../common/Resource';
import {EXCHANGE_GOODS, ExchangeGood} from '../../common/dune/smugglingExchange';

// Since selling may stand above buying the same good (Jens 27 Oct 2026, variant G of
// _mockups/dune/choam/kurs-dynamik.html), buying cheap and selling dear at the guild in one generation would print
// money. So a good a player bought from the guild cannot be sold to it in the same generation, and the other way round.
// The record knows its generation; a new generation starts empty without being reset.

export type GuildRoundTrips = {
  generation: number,
  /** Goods each player sold to and bought from the guild in that generation */
  players: Record<PlayerId, {sold: Array<ExchangeGood>, bought: Array<ExchangeGood>}>,
};

function isExchangeGood(resource: Resource): resource is ExchangeGood {
  return (EXCHANGE_GOODS as ReadonlyArray<Resource>).includes(resource);
}

function entryOf(record: GuildRoundTrips | undefined, player: PlayerId, generation: number) {
  return record?.generation === generation ? record.players[player] : undefined;
}

/** The record after a guild trade of `player`: what was given counts as sold, what was got as bought */
export function recordRoundTrip(record: GuildRoundTrips | undefined, player: PlayerId, generation: number, give: Resource, get: Resource): GuildRoundTrips {
  const current = record?.generation === generation ? record : {generation, players: {}};
  const entry = entryOf(current, player, generation) ?? {sold: [], bought: []};
  const sold = isExchangeGood(give) && !entry.sold.includes(give) ? [...entry.sold, give] : entry.sold;
  const bought = isExchangeGood(get) && !entry.bought.includes(get) ? [...entry.bought, get] : entry.bought;
  return {generation, players: {...current.players, [player]: {sold, bought}}};
}

/** Whether `player` may sell `resource` to the guild now (not bought from it this generation) */
export function maySellToGuild(record: GuildRoundTrips | undefined, player: PlayerId, generation: number, resource: Resource): boolean {
  return !isExchangeGood(resource) || !(entryOf(record, player, generation)?.bought.includes(resource) ?? false);
}

/** Whether `player` may buy `resource` from the guild now (not sold to it this generation) */
export function mayBuyFromGuild(record: GuildRoundTrips | undefined, player: PlayerId, generation: number, resource: Resource): boolean {
  return !isExchangeGood(resource) || !(entryOf(record, player, generation)?.sold.includes(resource) ?? false);
}
