import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import HotkeyHelpDialog from '@/client/components/hotkeys/HotkeyHelpDialog.vue';
import {resetBindings, setBinding} from '@/client/hotkeys/hotkeyStore';

function mountDialog() {
  return mount(HotkeyHelpDialog, {
    ...globalConfig,
    props: {open: true},
    global: {
      ...globalConfig.global,
      stubs: {...globalConfig.global.stubs, SidebarModal: {props: ['open'], template: '<div v-if="open"><slot/></div>'}},
    },
  });
}

describe('HotkeyHelpDialog', () => {
  afterEach(() => {
    resetBindings();
  });

  it('is an information page until "Edit" is pressed', async () => {
    const wrapper = mountDialog();
    expect(wrapper.findAll('button.hotkey-row')).has.length(0);
    await wrapper.find('[data-test="hotkey-edit"]').trigger('click');
    expect(wrapper.findAll('button.hotkey-row').length).to.be.greaterThan(0);
    expect(wrapper.find('[data-test="hotkey-done"]').classes()).to.include('hotkey-dialog__button--cta');
  });

  it('takes a new key for the clicked entry', async () => {
    const wrapper = mountDialog();
    await wrapper.find('[data-test="hotkey-edit"]').trigger('click');
    await wrapper.findAll('button.hotkey-row')[0].trigger('click');
    window.dispatchEvent(new KeyboardEvent('keydown', {key: 'x'}));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('button.hotkey-row').text()).to.include('X');
  });

  it('takes a key clicked on the drawn keyboard', async () => {
    const wrapper = mountDialog();
    await wrapper.find('[data-test="hotkey-edit"]').trigger('click');
    await wrapper.findAll('button.hotkey-row')[0].trigger('click');
    const key = wrapper.findAll('.hotkey-keyboard__key').find((element) => element.text() === 'G');
    await key!.trigger('click');
    expect(wrapper.find('button.hotkey-row').text()).to.include('G');
  });

  it('cannot finish editing while a key is assigned twice', async () => {
    const wrapper = mountDialog();
    await wrapper.find('[data-test="hotkey-edit"]').trigger('click');
    setBinding('tab-projects', ['A']);
    await wrapper.vm.$nextTick();
    const done = wrapper.find('[data-test="hotkey-done"]');
    expect(done.attributes('disabled')).to.not.equal(undefined);
    expect(done.classes()).to.include('hotkey-dialog__button--blocked');
    expect(wrapper.findAll('.hotkey-row--duplicate')).has.length(2);
    await wrapper.find('[data-test="hotkey-close"]').trigger('click');
    expect(wrapper.emitted('close')).to.equal(undefined);
  });
});
