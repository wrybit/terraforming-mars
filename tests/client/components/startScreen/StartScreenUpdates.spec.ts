import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import StartScreenUpdates from '@/client/components/startScreen/StartScreenUpdates.vue';
import {FeatureLogDay, featureLogLanguage, presentDay} from '@/client/components/startScreen/featureLog';

function day(date: string, items = 2): FeatureLogDay {
  return {
    date,
    commits: 12,
    title: {en: `Title ${date}`, de: `Titel ${date}`},
    items: Array.from({length: items}, (_, index) => ({en: `Point ${index}`, de: `Punkt ${index}`})),
  };
}

describe('StartScreenUpdates', () => {
  it('shows nothing without days', () => {
    const wrapper = mount(StartScreenUpdates, {...globalConfig, props: {initialDays: []}});
    expect(wrapper.find('.start-updates').exists()).is.false;
  });

  it('shows at most 14 days, the newest one open', () => {
    const days = Array.from({length: 20}, (_, index) => day(`2026-09-${String(index + 1).padStart(2, '0')}`));
    const wrapper = mount(StartScreenUpdates, {...globalConfig, props: {initialDays: days}});
    const rows = wrapper.findAll('.start-updates-day');
    expect(rows).has.length(14);
    expect(rows[0].classes()).contains('start-updates-day--newest');
    expect(rows[1].classes()).not.contains('start-updates-day--newest');
    expect(rows[0].findAll('li:not(.start-updates-commits)')).has.length(2);
    // Commits close the list instead of sitting on the calendar sheet
    expect(rows[0].find('li:last-child').text()).eq('12 commits');
    expect(rows[0].find('.start-updates-sheet').text()).not.contains('commits');
  });

  it('works as an accordion: a click opens one day and closes the other', async () => {
    const days = Array.from({length: 4}, (_, index) => day(`2026-09-0${index + 1}`));
    const wrapper = mount(StartScreenUpdates, {...globalConfig, props: {initialDays: days}});
    const rows = wrapper.findAll('.start-updates-day');
    const open = () => rows.map((row) => row.classes().includes('start-updates-day--open'));
    expect(open()).deep.eq([true, false, false, false]);

    await rows[2].find('.start-updates-title').trigger('click');
    expect(open()).deep.eq([false, false, true, false]);
    expect(rows[2].attributes('aria-expanded')).eq('true');

    // Klick in die Punkte schaltet nicht um, erneuter Klick auf den Kopf schließt
    await rows[2].find('.start-updates-items li').trigger('click');
    expect(open()).deep.eq([false, false, true, false]);
    await rows[2].find('.start-updates-title').trigger('click');
    expect(open()).deep.eq([false, false, false, false]);

    // Tastatur
    await rows[1].trigger('keydown', {key: 'Enter'});
    expect(open()).deep.eq([false, true, false, false]);
  });

  it('uses German only for German, English for every other language', () => {
    expect(featureLogLanguage('de')).eq('de');
    expect(featureLogLanguage('fr')).eq('en');
    expect(presentDay(day('2026-10-11'), 'de').title).eq('Titel 2026-10-11');
    expect(presentDay(day('2026-10-11'), 'en').items[0]).eq('Point 0');
  });

  it('marks Sundays for the red calendar sheet', () => {
    expect(presentDay(day('2026-10-11'), 'en').sunday).is.true;
    expect(presentDay(day('2026-10-12'), 'en').sunday).is.false;
    expect(presentDay(day('2026-10-13'), 'de').shortDate).eq('13. Okt');
  });
});
