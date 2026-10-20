// DevTools: situations of the game asked of a player right now (common/devtools/devToolsAction.ts DevToolsTrigger),
// so every dialog can be tried without playing up to it. The question comes in front of what the player is asked
// anyway (Player.interruptWaitingFor); the game's queue runs it with all follow-ups, then the earlier question returns.
import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {PlayerInput} from '../PlayerInput';
import {OrOptions} from '../inputs/OrOptions';
import {SelectOption} from '../inputs/SelectOption';
import {SelectPayment} from '../inputs/SelectPayment';
import {SelectAmount} from '../inputs/SelectAmount';
import {SelectPlayer} from '../inputs/SelectPlayer';
import {SelectResources} from '../inputs/SelectResources';
import {SelectSpace} from '../inputs/SelectSpace';
import {PlaceCityTile} from '../deferredActions/PlaceCityTile';
import {PlaceOceanTile} from '../deferredActions/PlaceOceanTile';
import {PlaceGreeneryTile} from '../deferredActions/PlaceGreeneryTile';
import {Resource} from '../../common/Resource';
import {TileType} from '../../common/TileType';
import {CardName} from '../../common/cards/CardName';
import {SpaceType} from '../../common/boards/SpaceType';
import {RouteError} from '../routes/RouteError';
import {DEVTOOLS_TRIGGER_LABELS, DevToolsTrigger, DevToolsTriggerAction} from '../../common/devtools/devToolsAction';
import {WormData, distanceInput, rollWorm} from '../dune/Worm';
import {levyInput} from '../dune/WormLevy';
import {keepInput} from '../dune/Schemes';
import {
  addResourceInput, discardInput, draftInput, moveResourceInput, removeResourceInput, resourceChoiceInput, takeResourceInput,
} from './devToolsCardTriggers';

// A price that needs more than one currency: M€, steel, titanium and heat all get a row in the payment form
const PAY_AMOUNT = 12;
const PAYMENT_OPTIONS = {steel: true, titanium: true, heat: true};
const FREE_RESOURCES = 3;

// Special tiles with the card that places them (its name labels the choice, in the wording of the theme)
const SPECIAL_TILES: ReadonlyArray<{card: CardName, tileType: TileType, onOcean?: true}> = [
  {card: CardName.NATURAL_PRESERVE, tileType: TileType.NATURAL_PRESERVE},
  {card: CardName.MINING_AREA, tileType: TileType.MINING_AREA},
  {card: CardName.ECOLOGICAL_ZONE, tileType: TileType.ECOLOGICAL_ZONE},
  {card: CardName.COMMERCIAL_DISTRICT, tileType: TileType.COMMERCIAL_DISTRICT},
  {card: CardName.INDUSTRIAL_CENTER, tileType: TileType.INDUSTRIAL_CENTER},
  {card: CardName.NUCLEAR_ZONE, tileType: TileType.NUCLEAR_ZONE},
  {card: CardName.RESTRICTED_AREA, tileType: TileType.RESTRICTED_AREA},
  {card: CardName.CAPITAL, tileType: TileType.CAPITAL},
  {card: CardName.MOHOLE_AREA, tileType: TileType.MOHOLE_AREA, onOcean: true},
];

function noSpace(): never {
  throw RouteError.badRequest('Nothing to place: no space is free for this tile');
}

function placement(input: PlayerInput | undefined): PlayerInput {
  return input ?? noSpace();
}

// The form only shows currencies the player has: missing ones are topped up, in the log like every DevTools change
function atLeast(player: IPlayer, resource: Resource, amount: number): void {
  const missing = amount - player.stock.get(resource);
  if (missing > 0) {
    player.stock.add(resource, missing, {log: true});
  }
}

function paymentInput(player: IPlayer, amount: number): SelectPayment {
  return new SelectPayment('Pay for DevTools test', amount, PAYMENT_OPTIONS).andThen((payment) => {
    player.pay(payment);
    return undefined;
  });
}

// Two titanium for a price just above one: the split pays too much and the form asks for confirmation right away
function overpayInput(player: IPlayer): SelectPayment {
  const rate = player.getTitaniumValue();
  atLeast(player, Resource.TITANIUM, 2);
  return paymentInput(player, rate + 1).setPreset({titanium: 2});
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

// Target of an attack: the opponents (in a solo game the player himself, so the dialog still shows)
function playerInput(game: IGame, player: IPlayer): PlayerInput {
  const opponents = game.players.filter((other) => other !== player);
  return new SelectPlayer(opponents.length > 0 ? opponents : [player], 'Select player', 'Select').andThen(() => undefined);
}

function resourcesInput(player: IPlayer): PlayerInput {
  return new SelectResources('Select 3 resources of any kind', FREE_RESOURCES).andThen((units) => {
    for (const [resource, amount] of Object.entries(units) as Array<[Resource, number]>) {
      if (amount > 0) {
        player.stock.add(resource, amount, {log: true});
      }
    }
    return undefined;
  });
}

// First which special tile, then where: two questions like on the cards that place them
function specialTileInput(game: IGame, player: IPlayer): PlayerInput {
  const options = SPECIAL_TILES.map((special) => {
    const spaces = special.onOcean === true ?
      game.board.getSpaces(SpaceType.OCEAN).filter((space) => space.tile === undefined) :
      game.board.getAvailableSpacesOnLand(player);
    return {special, spaces};
  }).filter(({spaces}) => spaces.length > 0);
  if (options.length === 0) {
    noSpace();
  }
  return new OrOptions(...options.map(({special, spaces}) => new SelectOption(special.card, 'Select')
    .andThen(() => new SelectSpace('Select space for special tile', spaces).andThen((space) => {
      game.addTile(player, space, {tileType: special.tileType, card: special.card});
      return undefined;
    })))).setTitle('Select a special tile');
}

/** The first question of a trigger; undefined where a card queued it itself (the queue then asks it) */
function input(game: IGame, player: IPlayer, trigger: DevToolsTrigger): PlayerInput | undefined {
  switch (trigger) {
  case 'city':
    return placement(new PlaceCityTile(player).execute());
  case 'ocean':
    return placement(new PlaceOceanTile(player).execute());
  case 'greenery':
    return placement(new PlaceGreeneryTile(player).execute());
  case 'specialTile':
    return specialTileInput(game, player);
  case 'pay':
    atLeast(player, Resource.STEEL, 2);
    atLeast(player, Resource.TITANIUM, 2);
    atLeast(player, Resource.HEAT, 3);
    return paymentInput(player, PAY_AMOUNT);
  case 'overpay':
    return overpayInput(player);
  case 'convert':
    // The title is a known conversion (client amount/amountConversion.ts): the dialog shows energy turning into heat
    return new SelectAmount('Select amount of energy to convert to heat', 'OK', 0, player.energy, true)
      .andThen((amount) => {
        player.stock.deduct(Resource.ENERGY, amount);
        player.stock.add(Resource.HEAT, amount, {log: true});
        return undefined;
      });
  case 'resources':
    return resourcesInput(player);
  case 'player':
    return playerInput(game, player);
  case 'discard':
    return discardInput(player);
  case 'draft':
    return draftInput(player);
  case 'addResource':
    return addResourceInput(player);
  case 'removeResource':
    return removeResourceInput(player);
  case 'resourceChoice':
    return resourceChoiceInput(player);
  case 'moveResource':
    return moveResourceInput(player);
  case 'takeResource':
    return takeResourceInput(player);
  case 'milestone':
    return milestoneInput(game, player);
  case 'award':
    return awardInput(game, player);
  case 'worm':
    throw new Error('The worm is asked separately');
  case 'schemes':
    throw new Error('The agenda choice is asked separately');
  }
}

// Asks the input, runs the game's queue with every follow-up (bonuses, chained questions), then `done`
function ask(game: IGame, player: IPlayer, question: PlayerInput | undefined, done: (resume: () => void) => void): void {
  player.interruptWaitingFor((resume) => {
    player.defer(question);
    game.deferredActions.runAll(() => done(resume));
  });
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
  ask(game, payer, levyInput(payer, levy), (resume) => {
    worm.levies?.shift();
    resume();
    askLevies(game, worm, done);
  });
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
    // The chooser makes the game send the distances: only then the move tab with its map appears (dune/duneInputs.ts)
    worm.chooser = player.id;
    ask(game, player, distanceInput(game, worm), (resume) => askLevies(game, worm, resume));
    return;
  }
  if (action.trigger === 'schemes') {
    const schemes = game.duneData?.schemes;
    if (schemes === undefined) {
      throw RouteError.badRequest('This game has no House schemes');
    }
    // The choice when a House reached 35 on the Landsraad track: with only one agenda the player draws a second
    const agendas = schemes.agendas[player.id] ?? [];
    const drawn = agendas.length < 2 ? schemes.deck.shift() : undefined;
    if (drawn !== undefined) {
      schemes.agendas[player.id] = [...agendas, drawn];
      game.log('🛠 DevTools: ${0} draws a second agenda', (b) => b.player(player));
    }
    if ((schemes.agendas[player.id] ?? []).length < 2) {
      throw RouteError.badRequest('No second agenda left to draw');
    }
    ask(game, player, keepInput(player, schemes), (resume) => resume());
    return;
  }
  // Built before anything is put aside: a question that cannot be asked fails without touching the turn
  ask(game, player, input(game, player, action.trigger), (resume) => resume());
}
