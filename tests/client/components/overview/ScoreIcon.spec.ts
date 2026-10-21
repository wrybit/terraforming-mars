import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ScoreIcon from '@/client/components/overview/ScoreIcon.vue';

describe('ScoreIcon', () => {
  it('shows the picture of the score column with its tooltip', () => {
    const icon = shallowMount(ScoreIcon, {...globalConfig, props: {kind: 'tr'}});
    expect(icon.classes()).to.include('players-table-score-icon--tr');
    expect(icon.attributes('data-tooltip')).to.eq('Terraform Rating');
  });
});
