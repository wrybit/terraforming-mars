import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import LanguageFlag from '@/client/components/LanguageFlag.vue';
import {ALL_LANGUAGES} from '@/common/constants';
import fs from 'fs';

describe('LanguageFlag', () => {
  it('points to the rectangular flag of the language', () => {
    const wrapper = shallowMount(LanguageFlag, {...globalConfig, props: {lang: 'de'}});
    expect(wrapper.attributes('src')).eq('assets/flags/de.svg');
  });

  it('has a flag file for every language', () => {
    const missing = ALL_LANGUAGES.filter((lang) => !fs.existsSync(`assets/flags/${lang}.svg`));
    expect(missing).deep.eq([]);
  });
});
