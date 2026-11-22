import {expect} from 'chai';
import {testGame} from '../TestGame';
import {replaySource} from '../../src/server/replay/replaySource';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {TileType} from '../../src/common/TileType';
import {Phase} from '../../src/common/Phase';

describe('replaySource', () => {
  it('takes start values from the first save and end values from the last', () => {
    const [game, player, other] = testGame(2);
    const start = game.serialize();
    player.megaCredits = 42;
    player.cardsInHand = [];
    other.terraformRating = 30;
    game.increaseTemperature(player, 1);
    const source = replaySource(start, game.serialize());

    expect(source.players.map((p) => p.color)).deep.eq([player.color, other.color]);
    expect(source.players[0].endResources.megacredits).eq(42);
    expect(source.players[1].startTerraformRating).eq(20);
    expect(source.startTemperature).eq(-30);
  });

  it('starts imported games, whose only save is the end, from the usual start values', () => {
    const [game, player, other] = testGame(2);
    other.terraformRating = 37;
    game.increaseTemperature(player, 3);
    game.phase = Phase.END;
    const end = game.serialize();
    const source = replaySource(end, end);

    expect(source.players[1].startTerraformRating).eq(20);
    expect(source.startTemperature).eq(-30);
    expect(source.startOxygenLevel).eq(0);
    expect(source.players[0].dealtProjectCards).deep.eq([]);
  });

  it('names private log lines by colour, never by player id', () => {
    const [game, player] = testGame(2);
    const start = game.serialize();
    game.log('${0} drew ${1}', (b) => b.player(player).string('secret'), {reservedFor: player});
    const source = replaySource(start, game.serialize());
    const line = source.log[source.log.length - 1];

    expect(line.viewer).eq(player.color);
    expect(JSON.stringify(source)).does.not.contain(player.id);
  });

  it('lists the tiles of the end', () => {
    const [game, player] = testGame(2);
    const start = game.serialize();
    const space = game.board.getAvailableSpacesOnLand(player).find((s) => s.spaceType === SpaceType.LAND)!;
    game.addCity(player, space);
    const source = replaySource(start, game.serialize());

    expect(source.endTiles).deep.include({space: space.id, tileType: TileType.CITY});
  });
});
