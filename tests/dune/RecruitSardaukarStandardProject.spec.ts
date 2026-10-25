import {expect} from 'chai';
import {testGame} from '../TestGame';
import {BoardName} from '../../src/common/boards/BoardName';
import {CardName} from '../../src/common/cards/CardName';
import {RecruitSardaukarStandardProject} from '../../src/server/cards/dune/RecruitSardaukarStandardProject';
import {garrisonOf} from '../../src/server/dune/Kanly';
import {Payment} from '../../src/common/inputs/Payment';

describe('Recruit Sardaukar standard project (Dune module F)', () => {
  it('is a standard project only with the Kanly module', () => {
    const [kanlyGame] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61, duneModules: ['kanly']});
    expect(kanlyGame.standardProjects.map((card) => card.name)).includes(CardName.RECRUIT_SARDAUKAR_STANDARD_PROJECT);
    const [otherGame] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61, duneModules: ['bazaar']});
    expect(otherGame.standardProjects.map((card) => card.name)).not.includes(CardName.RECRUIT_SARDAUKAR_STANDARD_PROJECT);
    const [marsGame] = testGame(2);
    expect(marsGame.standardProjects.map((card) => card.name)).not.includes(CardName.RECRUIT_SARDAUKAR_STANDARD_PROJECT);
  });

  it('recruits 1 Sardaukar for 12 M€', () => {
    const [game, player] = testGame(2, {theme: 'dune', boardName: BoardName.ARRAKIS_61, duneModules: ['kanly']});
    const card = new RecruitSardaukarStandardProject();
    player.megaCredits = 11;
    expect(card.canAct(player)).is.false;
    player.megaCredits = 12;
    expect(card.canAct(player)).is.true;
    card.payAndExecute(player, Payment.of({megacredits: 12}));
    expect(player.megaCredits).eq(0);
    const kanly = game.duneData?.kanly;
    expect(kanly === undefined ? -1 : garrisonOf(kanly, player)).eq(1);
  });
});
