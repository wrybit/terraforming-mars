import {expect} from 'chai';
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {ReplaySourceModel} from '@/common/models/ReplaySourceModel';
import {SpaceModel} from '@/common/models/SpaceModel';
import {SpaceId} from '@/common/Types';
import {overlayGame, overlayPlayer, replayTrackView} from '@/client/components/replay/replayTrackOverlay';

const space = (id: string, tileType?: number) => ({id: id as SpaceId, x: 0, y: 0, spaceType: 'land', bonus: [], ...(tileType !== undefined ? {tileType} : {})}) as unknown as SpaceModel;
const finalGame = {venusScaleLevel: 30, temperature: 8, spaces: [space('01', 2), space('02', 0)], colonies: [{name: 'Luna', trackPosition: 6}]} as unknown as GameModel;
const finalPlayer = {color: 'red', megacredits: 40, fleetSize: 3} as unknown as PublicPlayerModel;

function source(complete: boolean): ReplaySourceModel {
  return {
    players: [], startTemperature: -30, startOxygenLevel: 0, endTiles: [], log: [],
    track: [
      {line: 0, game: {venusScaleLevel: 0, temperature: -30, colonies: [{name: 'Luna', trackPosition: 1}] as unknown as GameModel['colonies']}, spaces: [space('01'), space('02')], players: {red: {megacredits: 0, fleetSize: 1}}},
      {line: 5, game: {venusScaleLevel: 4}, spaces: [space('01', 2)], players: {red: {fleetSize: 2}}},
    ],
    trackComplete: complete,
  };
}

describe('replayTrackOverlay', () => {
  it('follows the steps with a track over the whole game', () => {
    const before = replayTrackView(source(true), 3);
    expect(overlayGame(finalGame, before).venusScaleLevel).eq(0);
    expect(overlayGame(finalGame, before).temperature).eq(-30);
    expect(overlayGame(finalGame, before).spaces.map((entry) => entry.tileType)).deep.eq([undefined, undefined]);
    expect(overlayPlayer(finalPlayer, before)).to.include({megacredits: 0, fleetSize: 1});
    // Entry noted at log length 5: holds from line 4 on
    const after = replayTrackView(source(true), 4);
    expect(overlayGame(finalGame, after).venusScaleLevel).eq(4);
    expect(overlayGame(finalGame, after).colonies[0].trackPosition).eq(1);
    expect(overlayGame(finalGame, after).spaces[0].tileType).eq(2);
    expect(overlayPlayer(finalPlayer, after).fleetSize).eq(2);
  });

  it('leaves what the log tells to the log with only the start of an older game', () => {
    const view = replayTrackView(source(false), 4);
    const game = overlayGame(finalGame, view);
    // Expansions from the track instead of the end …
    expect(game.venusScaleLevel).eq(4);
    expect(game.colonies[0].trackPosition).eq(1);
    // … the reconstructed values and tiles stay
    expect(game.temperature).eq(8);
    expect(game.spaces).eq(finalGame.spaces);
    expect(overlayPlayer(finalPlayer, view)).to.include({megacredits: 40, fleetSize: 2});
  });

  it('changes nothing without a track', () => {
    const view = replayTrackView({...source(true), track: undefined}, 4);
    expect(overlayGame(finalGame, view)).eq(finalGame);
    expect(overlayPlayer(finalPlayer, view)).eq(finalPlayer);
  });
});
