import {expect} from 'chai';
import {testGame} from '../TestGame';
import {Phase} from '../../src/common/Phase';
import {openPurchaseLines} from '../../src/server/logs/openPurchaseLines';
import {keep, LogType} from '../../src/server/deferredActions/ChooseCards';
import {GameLogs} from '../../src/server/routes/GameLogs';

describe('openPurchaseLines', () => {
  it('hides the card counts of the research phase still running from everyone', () => {
    const [game, player, player2] = testGame(2);
    game.phase = Phase.RESEARCH;
    keep(player, [], [], LogType.BOUGHT);
    const hidden = openPurchaseLines(game);
    expect(hidden.size).eq(1);
    const logs = new GameLogs();
    for (const reader of [player, player2]) {
      const lines = logs.getLogsForGameView(reader.id, game, game.generation);
      expect(lines.some((line) => line.message === '${0} ${1} ${2} card(s)')).is.false;
    }
  });

  it('shows the counts once the research phase is over', () => {
    const [game, player, player2] = testGame(2);
    game.phase = Phase.RESEARCH;
    keep(player, [], [], LogType.BOUGHT);
    game.phase = Phase.ACTION;
    expect(openPurchaseLines(game).size).eq(0);
    const lines = new GameLogs().getLogsForGameView(player2.id, game, game.generation);
    expect(lines.some((line) => line.message === '${0} ${1} ${2} card(s)')).is.true;
  });

  it('ignores cards drawn (not bought) during the research phase', () => {
    const [game, player] = testGame(2);
    game.phase = Phase.RESEARCH;
    keep(player, [], [], LogType.DREW);
    expect(openPurchaseLines(game).size).eq(0);
  });
});
