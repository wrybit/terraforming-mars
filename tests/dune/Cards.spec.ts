import {expect} from 'chai';
import {testGame} from '../TestGame';
import {TestPlayer} from '../TestPlayer';
import {IGame} from '../../src/server/IGame';
import {BoardName} from '../../src/common/boards/BoardName';
import {CardName} from '../../src/common/cards/CardName';
import {Resource} from '../../src/common/Resource';
import {DUNE_MODULES} from '../../src/common/dune/DuneModule';
import {GameCards} from '../../src/server/GameCards';
import {DEFAULT_GAME_OPTIONS} from '../../src/server/game/GameOptions';
import {BazaarConcession} from '../../src/server/cards/dune/BazaarConcession';
import {CaravanMaster} from '../../src/server/cards/dune/CaravanMaster';
import {MentatCalculation} from '../../src/server/cards/dune/MentatCalculation';
import {TleilaxuSpy} from '../../src/server/cards/dune/TleilaxuSpy';
import {Thumper} from '../../src/server/cards/dune/Thumper';
import {WormRider} from '../../src/server/cards/dune/WormRider';
import {DuneStabiliser} from '../../src/server/cards/dune/DuneStabiliser';
import {ChoamDirectorate} from '../../src/server/cards/dune/ChoamDirectorate';
import {GuildBank} from '../../src/server/cards/dune/GuildBank';
import {SmugglerNetwork} from '../../src/server/cards/dune/SmugglerNetwork';
import {FriendsOfEsmarTuek} from '../../src/server/cards/dune/FriendsOfEsmarTuek';
import {SardaukarRaid} from '../../src/server/cards/dune/SardaukarRaid';
import {SardaukarMercenaries} from '../../src/server/cards/dune/SardaukarMercenaries';
import {ShieldGenerator} from '../../src/server/cards/dune/ShieldGenerator';
import {WaterOfLife} from '../../src/server/cards/dune/WaterOfLife';
import {StillsuitFactory} from '../../src/server/cards/dune/StillsuitFactory';
import {priceFor} from '../../src/server/dune/Bazaar';
import {schemesModel} from '../../src/server/dune/Schemes';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {bribeCost, suspicionOf} from '../../src/server/dune/Smuggling';
import {garrisonOf, kanlyActions} from '../../src/server/dune/Kanly';
import {acceptOffer, feeOf, maxOffers} from '../../src/server/dune/Choam';
import {crossSpace, wormDistanceLimit} from '../../src/server/dune/Worm';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {SelectPlayer} from '../../src/server/inputs/SelectPlayer';
import {SelectSpace} from '../../src/server/inputs/SelectSpace';
import {cast} from '../../src/common/utils/utils';
import {runAllActions, setOxygenLevel} from '../TestingUtils';

describe('Dune expansion cards (E01–E16)', () => {
  let game: IGame;
  let player1: TestPlayer;
  let player2: TestPlayer;

  beforeEach(() => {
    [game, player1, player2] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61, duneModules: [...DUNE_MODULES]});
  });

  it('come into the deck only with their module', () => {
    const names = (modules: Array<typeof DUNE_MODULES[number]>) => new GameCards({...DEFAULT_GAME_OPTIONS, duneModules: modules})
      .getProjectCards().map((card) => card.name);
    expect(names([])).not.includes(CardName.WATER_OF_LIFE);
    const bazaar = names(['bazaar']);
    expect(bazaar).includes(CardName.BAZAAR_CONCESSION);
    expect(bazaar).includes(CardName.WATER_OF_LIFE);
    expect(bazaar).not.includes(CardName.THUMPER);
    expect(names([...DUNE_MODULES]).filter((name) => name.length > 0)).includes(CardName.SHIELD_GENERATOR);
  });

  it('E01 Bazaar Concession: 3 M€ off', () => {
    const bazaar = game.duneData!.bazaar!;
    bazaar.slots = ['Seed Bales', null, null, null, null];
    const before = priceFor(player1, bazaar, 0)!;
    player1.playedCards.push(new BazaarConcession());
    expect(priceFor(player1, bazaar, 0)).eq(before - 3);
  });

  it('E02 Caravan Master: the cheapest ware on display for free, also when the −6 slot is empty', () => {
    const bazaar = game.duneData!.bazaar!;
    bazaar.slots = ['Seed Bales', null, 'Seed Bales', null, null];
    new CaravanMaster().play(player1);
    expect(player1.plants).eq(24);
    expect(player1.production.megacredits).eq(2);
    // The −2 slot is cheaper than the +2 slot of the same ware
    expect(bazaar.slots).deep.eq(['Seed Bales', null, null, null, null]);
  });

  it('E03 Mentat Calculation: swap an agenda for one of the top 3', () => {
    const schemes = game.duneData!.schemes!;
    const [mine] = schemes.agendas[player1.id];
    const top = schemes.deck[0];
    const input = cast(new MentatCalculation().play(player1), OrOptions);
    // While choosing, only player 1 sees the top 3 (as cards in MentatSwapInput.vue)
    expect(schemesModel(game, schemes, player1).look?.agendas.map((agenda) => agenda.name)).deep.eq(schemes.deck.slice(0, 3));
    expect(schemesModel(game, schemes, player2).look).is.undefined;
    input.process({type: 'or', index: 0, response: {type: 'option'}}, player1);
    expect(schemesModel(game, schemes, player1).look).is.undefined;
    expect(schemes.agendas[player1.id]).includes(top);
    expect(schemes.agendas[player1.id]).not.includes(mine);
    expect(schemes.deck).includes(mine);
  });

  it('E04 Tleilaxu Spy: a private log line per agenda', () => {
    const input = cast(new TleilaxuSpy().play(player1), SelectPlayer);
    const before = game.gameLog.length;
    const view = cast(input.cb(player2), SelectOption);
    const lines = game.gameLog.slice(before);
    expect(lines).has.length(2);
    expect(lines.every((line) => line.playerId === player1.id)).is.true;
    // Then a tab with player 2's agenda cards, only for the spy, until closed
    const schemes = game.duneData!.schemes!;
    const look = schemesModel(game, schemes, player1).look;
    expect(look?.kind).eq('spy');
    expect(look?.target).eq(player2.color);
    expect(look?.agendas.map((agenda) => agenda.name)).deep.eq(schemes.agendas[player2.id]);
    expect(schemesModel(game, schemes, player2).look).is.undefined;
    view.cb(undefined);
    expect(schemesModel(game, schemes, player1).look).is.undefined;
  });

  it('E05 Thumper: the player chooses the distance this generation', () => {
    const worm = game.duneData!.worm!;
    // Full vegetation: normally the worm moves only 1 space; with the Thumper 1 to 3 (where the way allows)
    setOxygenLevel(game, game.max.oxygen);
    expect(wormDistanceLimit(game, worm)).eq(1);
    new Thumper().play(player1);
    expect(worm.thumper).eq(player1.id);
    expect(wormDistanceLimit(game, worm)).eq(3);
  });

  it('E06 Worm Rider: 2 titanium when the worm passes next to an own tile', () => {
    player1.playedCards.push(new WormRider());
    const space = game.board.getAvailableSpacesOnLand(player1)[0];
    game.addGreenery(player1, space);
    const neighbour = game.board.getAdjacentSpaces(space)[0];
    crossSpace(game, neighbour);
    expect(player1.titanium).eq(2);
  });

  it('E07 Dune Stabiliser: the worm spares this greenery, not the others', () => {
    const card = new DuneStabiliser();
    card.play(player1);
    runAllActions(game);
    const input = cast(player1.popWaitingFor(), SelectSpace);
    const stabilised = input.spaces[0];
    input.cb(stabilised);
    const worm = game.duneData!.worm!;
    expect(worm.spared).deep.eq([stabilised.id]);
    player1.plants = 5;
    crossSpace(game, stabilised, worm.spared);
    expect(player1.plants).eq(5);
    const other = game.board.getAvailableSpacesForGreenery(player1).find((space) => space.id !== stabilised.id)!;
    game.addGreenery(player1, other);
    crossSpace(game, other, worm.spared);
    expect(player1.plants).eq(2);
  });

  it('E08 CHOAM Directorate and E09 Guild Bank', () => {
    expect(maxOffers(player1)).eq(1);
    player1.playedCards.push(new GuildBank());
    expect(maxOffers(player1)).eq(2);
    player2.playedCards.push(new ChoamDirectorate());
    expect(feeOf(player2)).eq(0);
    const choam = game.duneData!.choam!;
    choam.offers.push({seller: player1.id, give: Resource.HEAT, giveAmount: 1, want: Resource.PLANTS, wantAmount: 1});
    player2.plants = 1;
    player2.megaCredits = 0;
    acceptOffer(game, choam, player2, choam.offers[0]);
    expect(player2.megaCredits).eq(0);
  });

  it('E10–E12: bribes, suspicion and raids', () => {
    expect(bribeCost(player1)).eq(10);
    player1.playedCards.push(new SmugglerNetwork());
    // A discount of 4 on the bribe of 10
    expect(bribeCost(player1)).eq(6);
    const smuggling = game.duneData!.smuggling!;
    smuggling.suspicion[player1.id] = 3;
    new FriendsOfEsmarTuek().play(player1);
    expect(suspicionOf(smuggling, player1)).eq(1);
    expect(player1.titanium).eq(3);
    smuggling.suspicion[player2.id] = 3;
    const tr = player2.terraformRating;
    new SardaukarRaid().play(player1);
    expect(player2.terraformRating).eq(tr - 1);
    expect(player1.megaCredits).eq(4);
  });

  it('E13 Sardaukar Mercenaries and E14 Shield Generator', () => {
    const kanly = game.duneData!.kanly!;
    new SardaukarMercenaries().play(player1);
    expect(garrisonOf(kanly, player1)).eq(2);
    // Shield Generator: 1 Sardaukar of player 2 holds the tile player 1 attacks
    player2.playedCards.push(new ShieldGenerator());
    const target = game.board.getAvailableSpacesOnLand(player2)[0];
    game.addGreenery(player2, target);
    player1.megaCredits = 20;
    const open = kanlyActions(player1, kanly).find((input) => input instanceof SelectSpace) as SelectSpace;
    open.cb(target);
    expect(kanly.battle?.troops[player2.id]).eq(1);
  });

  it('E15 Water of Life and E16 Stillsuit Factory', () => {
    const tr = player1.terraformRating;
    new WaterOfLife().play(player1);
    runAllActions(game);
    expect(player1.terraformRating).eq(tr + 2);
    new StillsuitFactory().play(player1);
    expect(player1.production.heat).eq(1);
    expect(player1.production.megacredits).eq(1);
  });
});
