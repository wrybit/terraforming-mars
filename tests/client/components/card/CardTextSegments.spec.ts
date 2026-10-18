import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CardTextSegments from '@/client/components/card/CardTextSegments.vue';

describe('CardTextSegments', () => {
  it('renders plain, rule and opponent segments', () => {
    const wrapper = mount(CardTextSegments, {
      ...globalConfig,
      props: {
        segments: [
          {text: 'Remove 3 plants ', style: 'plain'},
          {text: 'from any player', style: 'opponent'},
          {text: ' next to ', style: 'plain'},
          {text: 'no other tile', style: 'rule'},
        ],
      },
    });
    expect(wrapper.text()).to.eq('Remove 3 plants from any player next to no other tile');
    expect(wrapper.find('.card-text-opponent').text()).to.eq('from any player');
    expect(wrapper.find('mark').text()).to.eq('no other tile');
  });
});
