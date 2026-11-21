import {expect} from 'chai';
import {testGame} from '../TestGame';
import {PlaceOceanTile} from '../../src/server/deferredActions/PlaceOceanTile';

describe('PlaceOceanTile', () => {
  it('skips the placement when no space is left although oceans are not maxed', () => {
    const [game, player] = testGame(1);
    expect(game.canAddOcean()).is.true;

    expect(new PlaceOceanTile(player, {spaces: []}).execute()).is.undefined;
    expect(game.board.getOceanSpaces()).is.empty;
  });
});
