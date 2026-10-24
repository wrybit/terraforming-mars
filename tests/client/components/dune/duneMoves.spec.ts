import {expect} from 'chai';
import {PlayerInputModel, OrOptionsModel} from '@/common/models/PlayerInputModel';
import {InputResponse} from '@/common/inputs/InputResponse';
import {
  closeMove, inputAt, isMoveOffered, movePath, openDuneMove, openMove, registerMoveSender, sendMove, wrapResponse,
} from '@/client/components/dune/duneMoves';
import {displayedOptionIndices} from '@/client/components/orOptionsDisplayed';
import {BAZAAR_ACTION_TITLE, BAZAAR_WARE_TITLE, BRIBE_TITLE, DUNE_ACTIONS_TITLE, RECRUIT_TITLE} from '@/common/dune/duneActionTitles';

// Minimal input models: only what the move search reads
function option(title: PlayerInputModel['title']): PlayerInputModel {
  return {type: 'option', title, buttonLabel: 'OK'} as PlayerInputModel;
}

function or(title: string, ...options: Array<PlayerInputModel>): OrOptionsModel {
  return {type: 'or', title, buttonLabel: 'OK', options, initialIdx: undefined} as unknown as OrOptionsModel;
}

function ware(name: string): PlayerInputModel {
  return option({message: BAZAAR_WARE_TITLE, data: [{type: 0, value: name}, {type: 1, value: '5'}]} as PlayerInputModel['title']);
}

const menu = or('Take your first action',
  option('Standard projects'),
  or(DUNE_ACTIONS_TITLE,
    or(BAZAAR_ACTION_TITLE, ware('Oasis'), ware('Spice')),
    or(RECRUIT_TITLE, option('1 Sardaukar for 12 M€'), option('2 Sardaukar for 24 M€')),
    option({message: BRIBE_TITLE, data: [{type: 1, value: '4'}]} as PlayerInputModel['title'])),
  option('Pass for this generation'));

describe('duneMoves', () => {
  afterEach(() => closeMove());

  it('finds a move through the action menu and the module group', () => {
    expect(movePath(menu, [{title: RECRUIT_TITLE}])).deep.eq([1, 1]);
    expect(movePath(menu, [{title: BAZAAR_WARE_TITLE, value: 'Spice'}])).deep.eq([1, 0, 1]);
    expect(movePath(menu, [{title: 'Tribute to the great houses'}])).deep.eq([1, 2]);
  });

  it('reports a move that is not offered', () => {
    expect(movePath(menu, [{title: BAZAAR_WARE_TITLE, value: 'Water'}])).is.undefined;
    expect(isMoveOffered(menu, [{title: 'Open Kanly'}])).is.false;
    expect(isMoveOffered(undefined, [{title: RECRUIT_TITLE}])).is.false;
    expect(isMoveOffered(menu, [{title: RECRUIT_TITLE}])).is.true;
  });

  it('finds a forced choice that is the waiting input itself', () => {
    const forced = or(RECRUIT_TITLE, option('1 Sardaukar for 12 M€'));
    expect(movePath(forced, [{title: RECRUIT_TITLE}])).deep.eq([]);
  });

  it('wraps the answer in the choices of the way down', () => {
    const indices = [...movePath(menu, [{title: RECRUIT_TITLE}])!, 1];
    expect(inputAt(menu, indices)?.title).eq('2 Sardaukar for 24 M€');
    expect(wrapResponse(indices, {type: 'option'})).deep.eq(
      {type: 'or', index: 1, response: {type: 'or', index: 1, response: {type: 'or', index: 1, response: {type: 'option'}}}});
    expect(wrapResponse([], {type: 'amount', amount: 2})).deep.eq({type: 'amount', amount: 2});
  });

  it('sends through the registered sender and closes the move', () => {
    const sent: Array<InputResponse> = [];
    const unregister = registerMoveSender((response) => sent.push(response));
    openMove('kanly', [{title: RECRUIT_TITLE}]);
    expect(openDuneMove.tab).eq('kanly');
    expect(sendMove({type: 'option'})).is.true;
    expect(sent).deep.eq([{type: 'option'}]);
    expect(openDuneMove.tab).is.undefined;
    unregister();
    expect(sendMove({type: 'option'})).is.false;
  });

  it('keeps the module group out of the action menu', () => {
    const shown = displayedOptionIndices(menu).map((index) => menu.options[index].title);
    expect(shown).deep.eq(['Standard projects', 'Pass for this generation']);
  });
});
