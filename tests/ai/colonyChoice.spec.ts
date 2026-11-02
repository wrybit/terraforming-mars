import {expect} from 'chai';
import {Luna} from '../../src/server/colonies/Luna';
import {Ceres} from '../../src/server/colonies/Ceres';
import {SelectColony} from '../../src/server/inputs/SelectColony';
import {chooseColony} from '../../src/server/ai/colonyChoice';
import {testGame} from '../TestGame';

describe('colonyChoice', () => {
  it('trades with the colony that pays most', () => {
    const [game, player] = testGame(2, {coloniesExtension: true});
    const luna = new Luna();
    const ceres = new Ceres();
    game.colonies.splice(0, game.colonies.length, luna, ceres);
    luna.trackPosition = 6;
    ceres.trackPosition = 1;
    const input = new SelectColony('Select colony tile for trade', 'trade', [ceres, luna]);
    expect(chooseColony(input, player)).deep.eq({type: 'colony', colonyName: luna.name});
  });

  it('builds where the placement bonus helps most', () => {
    const [game, player] = testGame(2, {coloniesExtension: true});
    const luna = new Luna();
    const ceres = new Ceres();
    game.colonies.splice(0, game.colonies.length, ceres, luna);
    const input = new SelectColony('Select where to build colony', 'Build', [ceres, luna]);
    // Luna: +2 M€ production; Ceres: +3 steel once – production is worth more.
    expect(chooseColony(input, player)).deep.eq({type: 'colony', colonyName: luna.name});
  });

  it('leaves other colony choices to the quick rule', () => {
    const [game, player] = testGame(2, {coloniesExtension: true});
    const luna = new Luna();
    game.colonies.splice(0, game.colonies.length, luna);
    const input = new SelectColony('Select colony tile to remove', 'Remove colony', [luna]);
    expect(chooseColony(input, player)).to.be.undefined;
  });
});
