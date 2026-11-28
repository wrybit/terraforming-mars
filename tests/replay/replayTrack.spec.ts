import {expect} from 'chai';
import {testGame} from '../TestGame';
import {recordReplayTrack} from '../../src/server/replay/recordReplayTrack';
import {replayTrackForSource} from '../../src/server/replay/replayTrackForSource';
import {replayTrackSnapshot} from '../../src/server/replay/replayTrackSnapshot';
import {Game} from '../../src/server/Game';
import {Phase} from '../../src/common/Phase';
import {replayTrackAt} from '../../src/common/replay/ReplayTrack';

describe('replay track', () => {
  it('notes everything at the first save, afterwards only what changed', () => {
    const [game, player] = testGame(2, {venusNextExtension: true, coloniesExtension: true, turmoilExtension: true});
    recordReplayTrack(game);
    expect(game.replayTrack).has.length(1);
    const first = game.replayTrack[0];
    expect(first.game?.colonies).is.not.empty;
    expect(first.game?.turmoil).is.not.undefined;
    expect(Object.keys(first.players ?? {})).has.length(2);

    // Nothing changed: nothing noted
    recordReplayTrack(game);
    expect(game.replayTrack).has.length(1);

    game.increaseVenusScaleLevel(player, 1);
    player.megaCredits += 5;
    recordReplayTrack(game);
    expect(game.replayTrack).has.length(2);
    const second = game.replayTrack[1];
    // Venus and what depends on it (scores of milestones), not colonies or Turmoil
    expect(second.game?.venusScaleLevel).eq(game.getVenusScaleLevel());
    expect(second.game).does.not.have.any.keys('colonies', 'turmoil', 'temperature');
    expect(second.spaces).is.undefined;
    // Venus also raised the rating
    expect(second.players?.[player.color]).deep.eq({megacredits: player.megaCredits, terraformRating: player.terraformRating});
    expect(second.line).eq(game.gameLog.length);
  });

  it('folds back to the current state and survives saving and loading', () => {
    const [game, player] = testGame(2, {venusNextExtension: true, coloniesExtension: true});
    // Past the first generation: a game of generation 1 without corporations is loaded back into its research phase
    game.generation = 2;
    recordReplayTrack(game);
    game.increaseVenusScaleLevel(player, 2);
    recordReplayTrack(game);
    const saved = JSON.parse(JSON.stringify(game.serialize()));
    const loaded = Game.deserialize(saved);
    // Loading may save again (and note what it changed), the saved entries stay as they were
    expect(loaded.replayTrack.slice(0, saved.replayTrack.length)).deep.eq(saved.replayTrack);
    const folded = replayTrackAt(loaded.replayTrack, loaded.gameLog.length);
    expect(folded.game.venusScaleLevel).eq(loaded.getVenusScaleLevel());
    // An unchanged game adds nothing
    const length = loaded.replayTrack.length;
    recordReplayTrack(loaded);
    expect(loaded.replayTrack).has.length(length);
  });

  it('starts older games with their start, newer ones with their whole track', () => {
    const [game, player] = testGame(2, {venusNextExtension: true});
    const start = game.serialize();
    game.increaseVenusScaleLevel(player, 3);
    game.phase = Phase.END;
    // Saved before the track existed: its start comes first, the log decides the rest
    const older = replayTrackForSource(start, {...game.serialize(), replayTrack: undefined});
    expect(older.complete).is.false;
    expect(older.track).has.length(1);
    expect(older.track[0].line).eq(0);
    expect(older.track[0].game?.venusScaleLevel).eq(0);

    // Noted from the first save on: the track alone
    const [newer] = testGame(2, {venusNextExtension: true});
    recordReplayTrack(newer);
    const newerStart = newer.serialize();
    newer.phase = Phase.END;
    const complete = replayTrackForSource(newerStart, newer.serialize());
    expect(complete.complete).is.true;
    expect(complete.track).deep.eq(newer.replayTrack);
  });

  it('keeps no player ids', () => {
    const [game] = testGame(2, {coloniesExtension: true, turmoilExtension: true});
    const text = JSON.stringify(replayTrackSnapshot(game));
    for (const player of game.players) {
      expect(text).does.not.contain(player.id);
    }
  });
});
