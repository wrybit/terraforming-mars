import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {cityRaceBonus} from '../../src/server/ai/cityRaceAdapt';
import {drawStopPenalty} from '../../src/server/ai/drawStop';
import {incomeCityPlan} from '../../src/server/ai/cityFirstWithIncome';
import {hoardingWithoutCityPlan} from '../../src/server/ai/plantHoardDecay';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {TechnologyDemonstration} from '../../src/server/cards/base/TechnologyDemonstration';
import {Capital} from '../../src/server/cards/base/Capital';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {TileType} from '../../src/common/TileType';
import {InputResponse} from '../../src/common/inputs/InputResponse';

// Round 163 variants from the human games of 29.–31.10.
describe('AI round 163 variants', () => {
  afterEach(() => clearPlayerTunings());

  describe('cityRaceAdapt', () => {
    it('raises a city spot next to own greeneries only while an opponent leads in cities', () => {
      const [game, player, opponent] = testGame(2);
      const land = game.board.spaces.filter((space) => space.spaceType === SpaceType.LAND && space.tile === undefined);
      const spot = land.find((space) => game.board.getAdjacentSpaces(space).filter((next) => next.spaceType === SpaceType.LAND).length >= 4)!;
      const greenery = game.board.getAdjacentSpaces(spot).find((next) => next.spaceType === SpaceType.LAND)!;
      game.simpleAddTile(player, greenery, {tileType: TileType.GREENERY});
      setPlayerTuning(player.id, 'cityRaceAdapt');
      expect(cityRaceBonus(spot, player)).eq(0);
      const far = land.filter((space) => space !== spot && space !== greenery &&
        !game.board.getAdjacentSpaces(space).includes(spot)).slice(-4);
      game.simpleAddTile(opponent, far[0], {tileType: TileType.CITY});
      game.simpleAddTile(opponent, far[3], {tileType: TileType.CITY});
      expect(cityRaceBonus(spot, player)).to.be.greaterThan(0);
      clearPlayerTunings();
      expect(cityRaceBonus(spot, player)).eq(0);
    });
  });

  describe('drawStop', () => {
    it('lowers a draw move only while the hand is full of unplayable cards', () => {
      const [, player] = testGame(2);
      const drawCard = new TechnologyDemonstration();
      player.cardsInHand.push(drawCard);
      player.megaCredits = 0;
      const menu = new OrOptions();
      const play: InputResponse = {type: 'or', index: 0, response: {type: 'projectCard', card: drawCard.name, payment: {} as never}};
      setPlayerTuning(player.id, 'drawStop');
      expect(drawStopPenalty(player, menu, play)).eq(0);
      for (let index = 0; index < 10; index++) {
        player.cardsInHand.push(new Capital());
      }
      expect(drawStopPenalty(player, menu, play)).to.be.greaterThan(0);
      clearPlayerTunings();
      expect(drawStopPenalty(player, menu, play)).eq(0);
    });
  });

  describe('cityFirstWithIncome', () => {
    it('counts next generation\'s income as a city plan while plants do not pile up', () => {
      const [, player] = testGame(2);
      player.megaCredits = 10;
      player.production.override({megacredits: 5});
      player.plants = 8;
      expect(hoardingWithoutCityPlan(player)).is.true;
      setPlayerTuning(player.id, 'cityFirstWithIncome');
      expect(incomeCityPlan(player)).is.true;
      expect(hoardingWithoutCityPlan(player)).is.false;
      player.plants = 30;
      expect(incomeCityPlan(player)).is.false;
    });
  });
});
