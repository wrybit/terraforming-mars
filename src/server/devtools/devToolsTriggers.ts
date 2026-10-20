// DevTools: situations of the game asked of a player right now (common/devtools/devToolsAction.ts DevToolsTrigger),
// so every dialog can be tried without playing up to it. The question comes in front of what the player is asked
// anyway (Player.interruptWaitingFor); once answered, the follow-ups of the game run and the earlier question returns.
import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {OrOptions} from '../inputs/OrOptions';
import {SelectOption} from '../inputs/SelectOption';
import {SelectPayment} from '../inputs/SelectPayment';
import {SelectAmount} from '../inputs/SelectAmount';
import {PlaceCityTile} from '../deferredActions/PlaceCityTile';
import {PlaceOceanTile} from '../deferredActions/PlaceOceanTile';
import {PlaceGreeneryTile} from '../deferredActions/PlaceGreeneryTile';
import {Resource} from '../../common/Resource';
import {RouteError} from '../routes/RouteError';
import {DEVTOOLS_TRIGGER_LABELS, DevToolsTrigger, DevToolsTriggerAction} from '../../common/devtools/devToolsAction';
import {WormData, distanceInput, rollWorm} from '../dune/Worm';
import {levyInput} from '../dune/WormLevy';

// A price the player can pay in several ways, so paying too much (steel, titanium, heat) can be tried
const OVERPAY_AMOUNT = 7;

function noSpace(): never {
  throw RouteError.badRequest('Nothing to place: no space is free for this tile');
}

function placement(input: PlayerInput | undefined): PlayerInput {
  return input ?? noSpace();
}

// Milestones as in the action menu, but all of them and without cost or requirement
function milestoneInput(game: IGame, player: IPlayer): PlayerInput {
  const open = game.milestones.filter((milestone) => !game.milestoneClaimed(milestone));
  if (open.length === 0) {
    throw RouteError.badRequest('All milestones are claimed');
  }
  return new OrOptions(...open.map((milestone) => new SelectOption(milestone.name, 'Claim - ' + '(' + milestone.name + ')').andThen(() => {
    game.claimedMilestones.push({player, milestone});
    game.log('${0} claimed ${1} milestone', (b) => b.player(player).milestone(milestone));
    return undefined;
  }))).setTitle('Claim a milestone for free');
}

function awardInput(game: IGame, player: IPlayer): PlayerInput {
  const open = game.awards.filter((award) => !game.hasBeenFunded(award));
  if (open.length === 0) {
    throw RouteError.badRequest('All awards are funded');
  }
  return new OrOptions(...open.map((award) => new SelectOption(award.name, 'Fund - ' + '(' + award.name + ')').andThen(() => {
    game.fundAward(player, award);
    return undefined;
  }))).setTitle('Fund an award for free');
}

// Payment in the way of the move: one player after another answers his levy before the turn goes on
function askLevies(game: IGame, worm: WormData, done: () => void): void {
  const levy = worm.levies?.[0];
  if (levy === undefined) {
    worm.levies = undefined;
    done();
    return;
  }
  const payer = game.getPlayerById(levy.player);
  payer.interruptWaitingFor(levyInput(payer, levy), (resume) => {
    worm.levies?.shift();
    resume();
    askLevies(game, worm, done);
  });
}

function input(game: IGame, player: IPlayer, trigger: DevToolsTrigger): PlayerInput {
  switch (trigger) {
  case 'city':
    return placement(new PlaceCityTile(player).execute());
  case 'ocean':
    return placement(new PlaceOceanTile(player).execute());
  case 'greenery':
    return placement(new PlaceGreeneryTile(player).execute());
  case 'overpay':
    return new SelectPayment('Pay for DevTools test', OVERPAY_AMOUNT, {steel: true, titanium: true, heat: true})
      .andThen((payment) => {
        player.pay(payment);
        return undefined;
      });
  case 'convert':
    // The title is a known conversion (client amount/amountConversion.ts): the dialog shows energy turning into heat
    return new SelectAmount('Select amount of energy to convert to heat', 'OK', 0, player.energy, true)
      .andThen((amount) => {
        player.stock.deduct(Resource.ENERGY, amount);
        player.stock.add(Resource.HEAT, amount, {log: true});
        return undefined;
      });
  case 'milestone':
    return milestoneInput(game, player);
  case 'award':
    return awardInput(game, player);
  case 'worm':
    throw new Error('The worm is asked separately');
  }
}

export function applyTrigger(game: IGame, player: IPlayer, action: DevToolsTriggerAction): void {
  game.log('🛠 DevTools: ${0} is asked: ${1}', (b) => b.player(player).string(DEVTOOLS_TRIGGER_LABELS[action.trigger]));
  if (action.trigger === 'worm') {
    const worm = game.duneData?.worm;
    if (worm === undefined) {
      throw RouteError.badRequest('This game has no worm');
    }
    // A move like at the end of a generation: the die, the chosen distance, then the levies on the way
    rollWorm(game, worm);
    player.interruptWaitingFor(distanceInput(game, worm), (resume) => game.deferredActions.runAll(() => askLevies(game, worm, resume)));
    return;
  }
  // Placing a tile defers its bonuses: they run before the earlier question returns
  player.interruptWaitingFor(input(game, player, action.trigger), (resume) => game.deferredActions.runAll(resume));
}
