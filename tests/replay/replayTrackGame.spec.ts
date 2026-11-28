import {expect} from 'chai';
import {playRandomGame} from '../ai/playRandomGame';
import {IGame} from '../../src/server/IGame';
import {replayTrackSnapshot} from '../../src/server/replay/replayTrackSnapshot';
import {recordReplayTrack} from '../../src/server/replay/recordReplayTrack';
import {replayTrackAt} from '../../src/common/replay/ReplayTrack';
import {TestGameOptions} from '../TestGame';

// Same numbers on every run: a failing game can be looked at again
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// A good part of a game played at random: enough moves for every expansion to change
function playGame(gameOptions: Partial<TestGameOptions>): IGame {
  let played: IGame | undefined;
  const result = playRandomGame({
    playerCount: 2, gameOptions, maximumGenerations: 30, maximumDecisions: 1500, maximumAttemptsPerDecision: 200,
    random: seededRandom(7), seed: 0.42, inspect: (game) => played = game,
  });
  expect(['finished', 'decisionLimit', 'generationLimit'], result.stopDetail).includes(result.stopReason);
  return played!;
}

describe('replay track over a game', () => {
  for (const [name, options] of [
    ['Venus, colonies, Turmoil', {venusNextExtension: true, coloniesExtension: true, turmoilExtension: true}],
    // Underworld is left out: the random players of the test cannot answer its inputs
    ['Moon, planetary tracks, Ares', {moonExpansion: true, pathfindersExpansion: true, aresExtension: true, aresHazards: true}],
  ] as const) {
    it(`folds back to the game as it is: ${name}`, () => {
      const game = playGame(options);
      // The last move may not be saved yet
      recordReplayTrack(game);
      const folded = replayTrackAt(game.replayTrack, game.gameLog.length);
      const end = replayTrackSnapshot(game);
      expect(JSON.parse(JSON.stringify(folded))).deep.eq(JSON.parse(JSON.stringify(end)));
      // Noted along the way, not just once
      expect(game.replayTrack.length).is.greaterThan(20);
      // Every noted step can be shown: the expansion parts are there from the start on
      expect(game.replayTrack[0].game).to.include.keys(Object.keys(end.game).filter((key) => (end.game as Record<string, unknown>)[key] !== undefined));
    }).timeout(30_000);
  }
});
