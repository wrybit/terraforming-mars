import {expect} from 'chai';
import {applyDevToolsView, clearDevToolsView, saveDevToolsView} from '@/client/devtools/devToolsView';
import {devToolsState} from '@/client/devtools/devToolsState';
import {ViewModel} from '@/common/models/PlayerModel';
import {BoardName} from '@/common/boards/BoardName';

function model(): ViewModel {
  return {game: {temperature: -30, oxygenLevel: 0, oceans: 0, venusScaleLevel: 0, gameOptions: {boardName: BoardName.ARRAKIS, theme: 'dune'}}} as unknown as ViewModel;
}

describe('devToolsView', () => {
  afterEach(() => {
    devToolsState.enabled = false;
    clearDevToolsView();
  });

  it('pretends the stored values only while the DevTools are on', () => {
    saveDevToolsView({temperature: -10, oceans: 5, boardName: BoardName.THARSIS, theme: 'mars'});
    const off = model();
    applyDevToolsView(off);
    expect(off.game.temperature).eq(-30);

    devToolsState.enabled = true;
    const on = model();
    applyDevToolsView(on);
    expect(on.game.temperature).eq(-10);
    expect(on.game.oceans).eq(5);
    expect(on.game.oxygenLevel).eq(0);
    expect(on.game.gameOptions.boardName).eq(BoardName.THARSIS);
    expect(on.game.gameOptions.theme).eq('mars');
  });
});
