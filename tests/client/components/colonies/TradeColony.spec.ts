import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import TradeColony from '@/client/components/colonies/TradeColony.vue';
import {boardTabState, selectBoardTab} from '@/client/components/boardTabs/boardTabState';
import {ColonyName} from '@/common/colonies/ColonyName';
import {AndOptionsModel} from '@/common/models/PlayerInputModel';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {fakeGameModel, fakePlayerViewModel, fakePublicPlayerModel} from '../testHelpers';
import {fakeColony} from './coloniesFixtures';
import {tradeFees, tradeInput} from '@/client/components/colonies/tradeInput';

const luna = fakeColony(ColonyName.LUNA, {trackPosition: 2});
const io = fakeColony(ColonyName.IO, {visitor: 'blue'});

function tradeModel(): AndOptionsModel {
  const pay = (resource: string, amount: number) => ({type: 'option' as const, buttonLabel: '', title: {message: 'Pay ${0} ' + resource, data: [{type: LogMessageDataType.RAW_STRING as const, value: String(amount)}]}});
  return {
    type: 'and', title: 'Trade with a colony tile', buttonLabel: 'Trade',
    options: [
      {type: 'or', title: 'Pay trade fee', buttonLabel: 'Pay', options: [pay('M€', 9), pay('energy', 3)]},
      {type: 'colony', title: 'Select colony tile for trade', buttonLabel: 'trade', coloniesModel: [luna]},
    ],
  };
}

describe('TradeColony', () => {
  afterEach(() => selectBoardTab('mars'));

  it('recognises the trade input and its fees', () => {
    const input = tradeInput(tradeModel());
    expect(input).is.not.undefined;
    expect(tradeFees(input!.fee).map((fee) => [fee.kind, fee.amount])).deep.eq([['megacredits', 9], ['energy', 3]]);
  });

  it('opens the colonies board, offers only tradeable colonies and answers both inputs', async () => {
    let saved: any;
    const playerView = fakePlayerViewModel({game: fakeGameModel({colonies: [luna, io]}), thisPlayer: fakePublicPlayerModel({megacredits: 20, energy: 4})});
    const wrapper = mount(TradeColony, {...globalConfig, props: {playerView, playerinput: tradeModel(), onsave: (out: any) => saved = out, showsave: true}});
    expect(boardTabState.active).eq('colonies');
    expect(wrapper.find('[data-test="trade-offer-Io"]').attributes('disabled')).is.not.undefined;
    expect((wrapper.vm as any).canSave()).is.false;

    await wrapper.find('[data-test="trade-fee-energy"]').trigger('click');
    await wrapper.find('[data-test="trade-offer-Luna"]').trigger('click');
    expect(wrapper.find('.trade-colony__receipt').text()).contains('+4');
    (wrapper.vm as any).saveData();
    expect(saved).deep.eq({type: 'and', responses: [{type: 'or', index: 1, response: {type: 'option'}}, {type: 'colony', colonyName: 'Luna'}]});
  });
});
