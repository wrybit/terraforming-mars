import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PushToast from '@/client/components/common/PushToast.vue';

describe('PushToast', () => {
  it('shows nothing without a message from the service worker', () => {
    expect(mount(PushToast, {...globalConfig}).find('.push-toasts').exists()).is.false;
  });
});
