import {IPlayer} from '../IPlayer';
import {SelectParty} from '../inputs/SelectParty';
import {SelectDelegate} from '../inputs/SelectDelegate';
import {InputResponse} from '../../common/inputs/InputResponse';
import {PartyName} from '../../common/turmoil/PartyName';
import {Turmoil} from '../turmoil/Turmoil';
import {IGame} from '../IGame';
import {playerView, withCopy} from './gameCopy';
import {valuationContext} from './stateValue';

// Turmoil: the AI sent its delegates to a random party. Each party is tried on a copy of the game and valued by what
// strong players aim for (rulebook, FAQ and strategy reviews, _docs/ai/standard-sets.md):
// - lead the dominant party: its leader becomes chairman next generation (+1 TR, +1 influence);
// - every party leadership is worth 1 VP at the end – a party with few delegates is a cheap leadership;
// - steer the ruling party to the own tableau: the ruling bonus pays per tag or tile, for the rivals too;
// - Reds tax every TR step by 3 M€: keep them out when ahead on TR, let them rule when behind.
// Lobbying itself (free vs 5 M€ delegate) stays with the move search; this replaces the random party choice.

// The chairman gains 1 TR (a point and income for the rest of the game) and counts as a leader at the end.
const CHAIRMAN_POINTS = 1.5;
// Expected own TR steps in one generation under Reds, each taxed 3 M€.
const REDS_TAX_STEPS = 3;
const REDS_TAX_PER_STEP = 3;

type PartyOutlook = {chairman: boolean, leaderships: number, ownBonus: number, rivalBonus: number, redsRule: boolean};

function leadershipsOf(game: IGame, player: IPlayer): number {
  return Turmoil.getTurmoil(game).parties.filter((party) => party.partyLeader === player).length;
}

function outlookAfter(player: IPlayer, partyName: PartyName): PartyOutlook | undefined {
  return withCopy(playerView(player), (copy): PartyOutlook | undefined => {
    const copyPlayer = copy.getPlayerById(player.id);
    const turmoil = Turmoil.getTurmoil(copy);
    try {
      turmoil.sendDelegateToParty(copyPlayer, partyName, copy);
    } catch {
      return undefined;
    }
    const dominant = turmoil.dominantParty;
    const bonusFor = (someone: IPlayer) => Math.max(0, ...dominant.bonuses.map((bonus) => bonus.getScore(someone)));
    const rivals = copy.players.filter((other) => other.id !== copyPlayer.id);
    return {
      chairman: dominant.partyLeader === copyPlayer,
      leaderships: leadershipsOf(copy, copyPlayer),
      ownBonus: bonusFor(copyPlayer),
      rivalBonus: Math.max(0, ...rivals.map(bonusFor)),
      redsRule: dominant.name === PartyName.REDS,
    };
  });
}

function isTerraformLeader(player: IPlayer): boolean {
  return player.game.players.every((other) => other.terraformRating <= player.terraformRating);
}

/** Value in M€ of sending the own delegate to a party (exported for tests). */
export function partyValue(player: IPlayer, partyName: PartyName): number | undefined {
  const outlook = outlookAfter(player, partyName);
  if (outlook === undefined) return undefined;
  const victoryPoint = valuationContext(player.game, player).victoryPoint;
  const newLeaderships = outlook.leaderships - leadershipsOf(player.game, player);
  // Reds as ruling party: their tax hits whoever terraforms most; their bonus (+1 TR for the lowest TR) is in ownBonus.
  const redsTax = outlook.redsRule && isTerraformLeader(player) ? REDS_TAX_STEPS * REDS_TAX_PER_STEP : 0;
  return (outlook.chairman ? CHAIRMAN_POINTS * victoryPoint : 0) + newLeaderships * victoryPoint +
    outlook.ownBonus - outlook.rivalBonus - redsTax;
}

/** The party for the own delegate, or undefined when no party could be tried. */
export function chooseParty(input: SelectParty, player: IPlayer): InputResponse | undefined {
  let best: {partyName: PartyName, value: number} | undefined;
  for (const partyName of input.parties) {
    const value = partyValue(player, partyName);
    if (value !== undefined && (best === undefined || value > best.value)) {
      best = {partyName, value};
    }
  }
  return best === undefined ? undefined : {type: 'party', partyName: best.partyName};
}

/** Whose delegate to pick (e.g. to remove one): a rival's before a neutral one, never the own one if avoidable. */
export function chooseDelegate(input: SelectDelegate, player: IPlayer): InputResponse | undefined {
  const rival = input.players.find((delegate) => delegate !== 'NEUTRAL' && delegate.id !== player.id);
  const choice = rival ?? input.players.find((delegate) => delegate === 'NEUTRAL') ?? input.players[0];
  if (choice === undefined) return undefined;
  return {type: 'delegate', player: choice === 'NEUTRAL' ? 'NEUTRAL' : choice.color};
}
