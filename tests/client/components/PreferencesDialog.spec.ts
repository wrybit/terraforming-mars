import {mount, VueWrapper, DOMWrapper} from '@vue/test-utils';
import {expect} from 'chai';
import PreferencesDialog from '@/client/components/PreferencesDialog.vue';
import {Preference, PreferencesManager} from '@/client/utils/PreferencesManager';
import {globalConfig} from './getLocalVue';
import {PREFERENCE_GROUPS} from '@/client/components/preferencesGroups';
import {SoundManager} from '@/client/utils/SoundManager';
import {vi} from 'vitest';

describe('PreferencesDialog', () => {
  const preferencesManager = PreferencesManager.INSTANCE;

  function getDataTest(wrapper: VueWrapper<any>, field: Preference): DOMWrapper<Element> {
    return wrapper.find(`[data-test=${field}]`);
  }

  function getCheckbox(wrapper: VueWrapper<any>, field: Preference): HTMLInputElement {
    return getDataTest(wrapper, field).element as HTMLInputElement;
  }

  it('defaults properly set', () => {
    preferencesManager.set('learner_mode', true);
    preferencesManager.set('hide_awards_and_milestones', false);

    const wrapper = mount(PreferencesDialog, {
      ...globalConfig,
      props: {preferencesManager},
    });

    expect(preferencesManager.values().hide_awards_and_milestones).is.false;
    expect(getCheckbox(wrapper, 'hide_awards_and_milestones').checked).is.false;

    expect(getCheckbox(wrapper, 'learner_mode').checked).is.true;
    expect(preferencesManager.values().learner_mode).is.true;
  });

  it('the play buttons let both sounds be heard without switching them', async () => {
    const turn = vi.spyOn(SoundManager, 'playActivePlayerSound').mockImplementation(() => {});
    const lobby = vi.spyOn(SoundManager, 'pushToast').mockImplementation(() => {});
    preferencesManager.set('enable_sounds', true);
    const wrapper = mount(PreferencesDialog, {...globalConfig, props: {preferencesManager}});
    const buttons = wrapper.findAll('.preferences-preview');
    expect(buttons).has.length(2);
    await buttons[0].trigger('click');
    await buttons[1].trigger('click');
    expect(turn).toHaveBeenCalledOnce();
    expect(lobby).toHaveBeenCalledOnce();
    expect(getCheckbox(wrapper, 'enable_sounds').checked).is.true;
    vi.restoreAllMocks();
  });

  it('toggling sets the underlying preferences', async () => {
    const wrapper = mount(PreferencesDialog, {
      ...globalConfig,
      props: {preferencesManager},
    });

    expect(preferencesManager.values().hide_awards_and_milestones).is.false;

    const cbWrapper = getDataTest(wrapper, 'hide_awards_and_milestones');
    const cb = getCheckbox(wrapper, 'hide_awards_and_milestones');
    cb.checked = true;
    cbWrapper.trigger('change');
    await wrapper.vm.$nextTick();

    expect(preferencesManager.values().hide_awards_and_milestones).is.true;
  });

  it('shows each switch exactly once, grouped', () => {
    const wrapper = mount(PreferencesDialog, {
      ...globalConfig,
      props: {preferencesManager},
    });
    const shown = wrapper.findAll('input[data-test]').map((input) => input.attributes('data-test'));
    const expected = PREFERENCE_GROUPS.flatMap((group) => group.switches.map((item) => item.preference));
    expect(shown).deep.eq(expected);
    expect(new Set(shown).size).eq(shown.length);
    expect(wrapper.findAll('.preferences-group')).has.length(PREFERENCE_GROUPS.length);
    expect(wrapper.find('.dialog-frame-title').text()).eq('Settings');
  });
});
