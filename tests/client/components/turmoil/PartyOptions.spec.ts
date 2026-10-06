import {mount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import {expect} from 'chai';
import PartyOptions from '@/client/components/turmoil/PartyOptions.vue';
import {partyChoice} from '@/client/components/turmoil/partyChoice';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {PartyName} from '@/common/turmoil/PartyName';
import {fakeTurmoil} from './turmoilFixtures';

const options = Object.values(PartyName).map((title) => ({type: 'option', title, buttonLabel: 'Select'} as PlayerInputModel));

describe('PartyOptions', () => {
  it('shows a party card per option and selects the option of the tapped card', async () => {
    const wrapper = mount(PartyOptions, {
      ...globalConfig,
      props: {cards: partyChoice(options)!, options, selected: undefined, groupName: 'parties', turmoil: fakeTurmoil()},
    });
    expect(wrapper.findAll('.select-party__card')).has.length(6);
    await wrapper.find('[data-test="party-Reds"] input').trigger('change');
    expect(wrapper.emitted('select')?.[0]).deep.eq([options[4]]);
  });
});
