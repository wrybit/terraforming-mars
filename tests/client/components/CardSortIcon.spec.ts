import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import CardSortIcon from '@/client/components/cardfilter/CardSortIcon.vue';

describe('CardSortIcon', () => {
  it('shows an icon per sorting', () => {
    expect(mount(CardSortIcon, {...globalConfig, props: {sortKey: 'cost'}}).find('.resource_icon--megacredits').exists()).is.true;
    expect(mount(CardSortIcon, {...globalConfig, props: {sortKey: 'type'}}).findAll('.card-sort-icon--types i')).to.have.length(3);
    expect(mount(CardSortIcon, {...globalConfig, props: {sortKey: 'manual'}}).find('svg').exists()).is.true;
  });
});
