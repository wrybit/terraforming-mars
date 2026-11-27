import {expect} from 'chai';
import {computeCardImpact} from '../../src/server/models/cardImpact';
import {CardImpactLine} from '../../src/common/models/CardImpact';
import {Tag} from '../../src/common/cards/Tag';
import {IGame} from '../../src/server/IGame';
import {TestPlayer} from '../TestPlayer';
import {testGame} from '../TestGame';
import {addCity, runAllActions, setOxygenLevel, setTemperature} from '../TestingUtils';
import {Insects} from '../../src/server/cards/base/Insects';
import {PowerGrid} from '../../src/server/cards/base/PowerGrid';
import {Worms} from '../../src/server/cards/base/Worms';
import {TollStation} from '../../src/server/cards/base/TollStation';
import {TerraformingGanymede} from '../../src/server/cards/base/TerraformingGanymede';
import {IoMiningIndustries} from '../../src/server/cards/base/IoMiningIndustries';
import {Asteroid} from '../../src/server/cards/base/Asteroid';
import {DeimosDown} from '../../src/server/cards/base/DeimosDown';
import {MiningExpedition} from '../../src/server/cards/base/MiningExpedition';
import {NitrogenRichAsteroid} from '../../src/server/cards/base/NitrogenRichAsteroid';
import {Insulation} from '../../src/server/cards/base/Insulation';
import {HiredRaiders} from '../../src/server/cards/base/HiredRaiders';
import {Sabotage} from '../../src/server/cards/base/Sabotage';
import {Zeppelins} from '../../src/server/cards/base/Zeppelins';
import {MedicalLab} from '../../src/server/cards/base/MedicalLab';
import {MartianRails} from '../../src/server/cards/base/MartianRails';
import {RoboticWorkforce} from '../../src/server/cards/base/RoboticWorkforce';
import {Mine} from '../../src/server/cards/base/Mine';
import {ProtectedHabitats} from '../../src/server/cards/base/ProtectedHabitats';
import {Virus} from '../../src/server/cards/base/Virus';
import {Birds} from '../../src/server/cards/base/Birds';
import {ImmigrationShuttles} from '../../src/server/cards/base/ImmigrationShuttles';

describe('cardImpact', () => {
  let game: IGame;
  let player: TestPlayer;
  let opponent: TestPlayer;

  beforeEach(() => {
    [game, player, opponent] = testGame(2);
  });

  function impact(card: Parameters<typeof computeCardImpact>[1]): ReadonlyArray<CardImpactLine> {
    return computeCardImpact(player, card) ?? [];
  }

  it('counts wild tags into "per tag" production and matches the real play', () => {
    setOxygenLevel(game, 6);
    player.tagsForTest = {[Tag.PLANT]: 2, [Tag.WILD]: 1};
    const card = new Insects();
    const [line] = impact(card);
    expect(line.basis).deep.eq({type: 'count', count: {kind: 'tag', tag: Tag.PLANT, own: 2, wild: 1, self: 0, others: false}});
    expect(line.gains).deep.eq([{resource: 'plants', amount: 3, production: true}]);

    card.play(player);
    runAllActions(game);
    expect(player.production.plants).eq(3);
  });

  it('counts the card itself when the text says "including this"', () => {
    player.tagsForTest = {[Tag.POWER]: 2};
    const card = new PowerGrid();
    const [line] = impact(card);
    expect(line.basis).deep.eq({type: 'count', count: {kind: 'tag', tag: Tag.POWER, own: 2, wild: 0, self: 1, others: false}});
    expect(line.gains).deep.eq([{resource: 'energy', amount: 3, production: true}]);
    card.play(player);
    expect(player.production.energy).eq(3);
  });

  it('divides with per and rounds down', () => {
    setOxygenLevel(game, 4);
    player.tagsForTest = {[Tag.MICROBE]: 3};
    const card = new Worms();
    const [line] = impact(card);
    expect(line.basis).deep.include({per: 2});
    expect(line.gains).deep.eq([{resource: 'plants', amount: 2, production: true}]);
    card.play(player);
    expect(player.production.plants).eq(2);
  });

  it('counts opponents\' tags raw (their wild tags do not count)', () => {
    opponent.tagsForTest = {[Tag.SPACE]: 3, [Tag.WILD]: 2};
    const [line] = impact(new TollStation());
    expect(line.basis).deep.eq({type: 'count', count: {kind: 'tag', tag: Tag.SPACE, own: 3, wild: 0, self: 0, others: true}});
    expect(line.gains).deep.eq([{resource: 'megacredits', amount: 3, production: true}]);
  });

  it('works out TR of Terraforming Ganymede with wild tags like its play code', () => {
    player.tagsForTest = {[Tag.JOVIAN]: 1, [Tag.WILD]: 1};
    const card = new TerraformingGanymede();
    const [line] = impact(card);
    expect(line.gains).deep.eq([{resource: 'tr', amount: 3}]);
    const before = player.terraformRating;
    card.play(player);
    expect(player.terraformRating - before).eq(3);
  });

  it('counts victory points without wild tags, like final scoring', () => {
    player.tagsForTest = {[Tag.JOVIAN]: 2, [Tag.WILD]: 1};
    const lines = impact(new IoMiningIndustries());
    expect(lines).has.length(1); // The fixed production is printed and left out
    expect(lines[0].basis).deep.eq({type: 'count', count: {kind: 'tag', tag: Tag.JOVIAN, own: 2, wild: 0, self: 1, others: false}});
    expect(lines[0].gains).deep.eq([{resource: 'vp', amount: 3}]);
  });

  it('leaves out effects that are printed on the card', () => {
    expect(impact(new Zeppelins())).has.length(1); // only the cities on Mars, not the fixed VP
    player.tagsForTest = {[Tag.BUILDING]: 7};
    const lines = impact(new MedicalLab());
    expect(lines).has.length(1);
    expect(lines[0].gains).deep.eq([{resource: 'megacredits', amount: 4, production: true}]);
  });

  it('shows the temperature bonuses crossed and matches the real play', () => {
    setTemperature(game, -26);
    const card = new DeimosDown();
    const bonus = impact(card).find((line) => line.basis.type === 'trackBonus');
    expect(bonus?.basis).deep.eq({type: 'trackBonus', parameter: 'temperature', values: [-24, -20]});
    expect(bonus?.gains).deep.eq([{resource: 'heat', amount: 2, production: true}]);
    card.play(player);
    runAllActions(game);
    expect(player.production.heat).eq(2);
  });

  it('follows the oxygen bonus into a temperature step and its own bonus', () => {
    setOxygenLevel(game, 7);
    setTemperature(game, -26);
    const bonus = impact(new MiningExpedition()).find((line) => line.basis.type === 'trackBonus');
    expect(bonus?.gains).deep.eq([
      {resource: 'temperature', amount: 1},
      {resource: 'tr', amount: 1},
      {resource: 'heat', amount: 1, production: true},
    ]);
  });

  it('removes only what the opponent has and respects protection', () => {
    opponent.plants = 5;
    let line = impact(new DeimosDown()).find((l) => l.basis.type === 'attack');
    expect(line?.basis).deep.eq({type: 'attack', resource: 'plants', max: 8});
    expect(line?.targets).deep.eq([{player: {color: opponent.color, name: opponent.name}, amount: 5}]);

    opponent.playedCards.push(new ProtectedHabitats());
    line = impact(new Asteroid()).find((l) => l.basis.type === 'attack');
    expect(line?.targets).deep.eq([{player: {color: opponent.color, name: opponent.name}, amount: 0, protected: true}]);
  });

  it('keeps one line per attack option however many players there are', () => {
    const [game5, me, ...others] = testGame(5);
    others.forEach((other, index) => other.steel = index + 1);
    const lines = computeCardImpact(me, new Sabotage()) ?? [];
    expect(lines).has.length(1); // Only steel: nobody has titanium or M€
    expect(lines[0].targets?.map((t) => t.amount)).deep.eq([1, 2, 3, 4]);
    others[0].steel = 0;
    const [withEmpty] = computeCardImpact(me, new Sabotage()) ?? [];
    expect(withEmpty.targets?.map((t) => t.empty === true)).deep.eq([true, false, false, false]); // Keeps its column
    expect(game5.isSoloMode()).is.false;
  });

  it('applies the plant-tag threshold of Nitrogen-Rich Asteroid with wild tags', () => {
    player.tagsForTest = {[Tag.PLANT]: 2, [Tag.WILD]: 1};
    const card = new NitrogenRichAsteroid();
    const line = impact(card).find((l) => l.basis.type === 'threshold');
    expect(line?.gains).deep.eq([{resource: 'plants', amount: 4, production: true}]);
    card.play(player);
    runAllActions(game);
    expect(player.production.plants).eq(4);
  });

  it('offers the whole heat production for Insulation', () => {
    player.production.override({heat: 4});
    const [line] = impact(new Insulation());
    expect(line.basis).deep.eq({type: 'upTo', resource: 'heat', production: true, max: 4});
  });

  it('lists steal and removal options with the amount each opponent would lose', () => {
    opponent.steel = 3;
    opponent.megaCredits = 14;
    const raids = impact(new HiredRaiders());
    expect(raids.map((l) => [l.basis, l.targets?.map((t) => t.amount)])).deep.eq([
      [{type: 'attack', resource: 'steel', max: 2}, [2]],
      [{type: 'attack', resource: 'megacredits', max: 3}, [3]],
    ]);
    const sabotage = impact(new Sabotage());
    expect(sabotage.map((l) => l.targets?.map((t) => t.amount))).deep.eq([[3], [7]]);
  });

  it('shows animals Virus can take from one card', () => {
    const birds = new Birds();
    opponent.playedCards.push(birds);
    birds.resourceCount = 3;
    const line = impact(new Virus()).find((l) => l.basis.type === 'attack' && l.basis.resource === 'Animal');
    expect(line?.targets?.map((t) => t.amount)).deep.eq([2]);
  });

  it('counts the action of Martian Rails and the VP per 3 cities', () => {
    addCity(opponent);
    addCity(player);
    const [rails] = impact(new MartianRails());
    expect(rails.basis).deep.include({action: true});
    expect(rails.gains).deep.eq([{resource: 'megacredits', amount: 2}]);
    addCity(opponent);
    const [shuttles] = impact(new ImmigrationShuttles());
    expect(shuttles.gains).deep.eq([{resource: 'vp', amount: 1}]);
  });

  it('lists every card Robotic Workforce can copy, without ranking them', () => {
    player.playedCards.push(new Mine());
    const lines = impact(new RoboticWorkforce());
    expect(lines.map((l) => [l.basis, l.gains])).deep.eq([[{type: 'card', card: 'Mine'}, [{resource: 'steel', amount: 1, production: true}]]]);
  });
});
