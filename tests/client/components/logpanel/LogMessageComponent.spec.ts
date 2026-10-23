import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import LogMessageComponent from '@/client/components/logpanel/LogMessageComponent.vue';
import {fakeViewModel} from '../testHelpers';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {CardName} from '@/common/cards/CardName';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import {toggleSpoiler} from '@/client/components/logpanel/aiAnalysis/aiSpoilers';
import {Resource} from '@/common/Resource';
import {CardResource} from '@/common/CardResource';

describe('LogMessageComponent', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(LogMessageComponent, {
      ...globalConfig,
      props: {
        message: new LogMessage(LogMessageType.DEFAULT, 'Test message', []),
        viewModel: fakeViewModel(),
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('renders CARD type as a single card span', () => {
    const message = new LogMessage(LogMessageType.DEFAULT, '${0}', [
      {type: LogMessageDataType.CARD, value: CardName.ANTS},
    ]);
    const wrapper = shallowMount(LogMessageComponent, {
      ...globalConfig,
      props: {
        message,
        viewModel: fakeViewModel(),
      },
    });

    const cardContainer = wrapper.find('.log-card').element.parentElement!;
    expect(cardContainer.innerHTML).to.equal(
      '<span class="log-card background-color-active">Ants</span>',
    );
  });

  it('renders CARDS type as multiple card spans with locale-correct separator in English', () => {
    const message = new LogMessage(
      LogMessageType.DEFAULT,
      '${0}',
      [{type: LogMessageDataType.CARDS, value: [CardName.ALGAE, CardName.BIRDS, CardName.CELESTIC]}]);

    const wrapper = shallowMount(LogMessageComponent, {
      ...globalConfig,
      props: {message, viewModel: fakeViewModel()},
    });

    const cardsContainer = wrapper.find('.log-card').element.parentElement!;
    expect(cardsContainer.innerHTML).to.equal(
      '<span class="log-card background-color-automated">Algae</span>' +
      ', ' +
      '<span class="log-card background-color-active">Birds</span>' +
      ', and ' +
      '<span class="log-card background-color-corporation">Celestic</span>',
    );
  });

  it('renders CARDS type as multiple card spans', () => {
    const message = new LogMessage(LogMessageType.DEFAULT, '${0}', [
      {type: LogMessageDataType.CARDS, value: [CardName.ANTS, CardName.ECOLINE, CardName.BIRDS]},
    ]);
    const wrapper = shallowMount(LogMessageComponent, {
      ...globalConfig,
      props: {
        message,
        viewModel: fakeViewModel(),
      },
    });

    const cardsContainer = wrapper.find('.log-card').element.parentElement!;
    expect(cardsContainer.innerHTML).to.equal(
      '<span class="log-card background-color-active">Ants</span>' +
      ', ' +
      '<span class="log-card background-color-corporation">Ecoline</span>' +
      ', and ' +
      '<span class="log-card background-color-active">Birds</span>',
    );
  });

  it('renders CARDS with locale-correct separator for French (fr)', () => {
    PreferencesManager.INSTANCE.set('lang', 'fr');
    try {
      const message = new LogMessage(
        LogMessageType.DEFAULT,
        '${0}',
        [{type: LogMessageDataType.CARDS, value: [CardName.ALGAE, CardName.BIRDS, CardName.CELESTIC]}]);
      const wrapper = shallowMount(LogMessageComponent, {
        ...globalConfig,
        props: {message, viewModel: fakeViewModel()},
      });
      // French conjunction list format: "A, B et C" (no Oxford comma)
      const cardsContainer = wrapper.find('.log-card').element.parentElement!;
      expect(cardsContainer.innerHTML).to.equal(
        '<span class="log-card background-color-automated">Algae</span>' +
        ', ' +
        '<span class="log-card background-color-active">Birds</span>' +
        ' et ' +
        '<span class="log-card background-color-corporation">Celestic</span>',
      );
    } finally {
      PreferencesManager.resetForTest();
    }
  });

  it('renders CARDS with locale-correct separator for Japanese (jp)', () => {
    PreferencesManager.INSTANCE.set('lang', 'jp');
    try {
      const message = new LogMessage(
        LogMessageType.DEFAULT,
        '${0}',
        [{type: LogMessageDataType.CARDS, value: [CardName.ALGAE, CardName.BIRDS, CardName.CELESTIC]}]);
      const wrapper = shallowMount(LogMessageComponent, {
        ...globalConfig,
        props: {message, viewModel: fakeViewModel()},
      });
      // Japanese conjunction list format: "A、B、C" (Japanese comma separator)
      const cardsContainer = wrapper.find('.log-card').element.parentElement!;
      expect(cardsContainer.innerHTML).to.equal(
        '<span class="log-card background-color-automated">Algae</span>' +
        '、' +
        '<span class="log-card background-color-active">Birds</span>' +
        '、' +
        '<span class="log-card background-color-corporation">Celestic</span>',
      );
    } finally {
      PreferencesManager.resetForTest();
    }
  });

  it('links the game id of a finished game to the results page of the viewer', () => {
    const viewModel = fakeViewModel();
    const message = new LogMessage(LogMessageType.DEFAULT, 'This game id was ${0}', [{type: LogMessageDataType.RAW_STRING, value: 'g123'}]);
    const wrapper = shallowMount(LogMessageComponent, {...globalConfig, props: {message, viewModel}});
    const link = wrapper.find('a.log-results-link');
    expect(link.text()).eq('g123');
    expect(link.attributes('href')).eq('the-end?id=' + viewModel.id);
  });

  it('marks an own private line as visible only to the reader', () => {
    const message = new LogMessage(LogMessageType.DEFAULT, 'Test message', [], 'p-own' as LogMessage['playerId']);
    const wrapper = shallowMount(LogMessageComponent, {...globalConfig, props: {message, viewModel: fakeViewModel()}});
    expect(wrapper.find('.log-private').exists()).is.true;
  });

  it('blurs an AI line of an analysis game until clicked, a second click hides it again', async () => {
    const message: LogMessage = {...new LogMessage(LogMessageType.DEFAULT, 'Test message', []), id: 'spoiler-test', aiInsight: 'red'};
    const wrapper = shallowMount(LogMessageComponent, {...globalConfig, props: {message, viewModel: fakeViewModel()}});
    expect(wrapper.find('.log-private').exists()).is.false;
    expect(wrapper.find('li').classes()).to.include('log-line--spoiler-hidden');
    toggleSpoiler(message);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('li').classes()).not.to.include('log-line--spoiler-hidden');
    toggleSpoiler(message);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('li').classes()).to.include('log-line--spoiler-hidden');
  });

  it('renders icons in plain text and STRING data', () => {
    const message = new LogMessage(LogMessageType.DEFAULT, 'spent :r:energy: for ${0}', [
      {type: LogMessageDataType.STRING, value: ':p:mc:'},
    ]);
    const wrapper = shallowMount(LogMessageComponent, {
      ...globalConfig,
      props: {message, viewModel: fakeViewModel()},
    });

    const html = wrapper.html();
    expect(html).includes('<span class="markdown-resource resource_icon--energy"></span>');
    expect(html).includes(
      '<span class="markdown-production"><span class="markdown-resource resource_icon--megacredits"></span></span>');
  });

  it('renders RESOURCE, PRODUCTION, and CARD_RESOURCE data as icons', () => {
    const message = new LogMessage(LogMessageType.DEFAULT, '${0} ${1} ${2}', [
      {type: LogMessageDataType.RESOURCE, value: Resource.STEEL},
      {type: LogMessageDataType.PRODUCTION, value: Resource.HEAT},
      {type: LogMessageDataType.CARD_RESOURCE, value: CardResource.SYNDICATE_FLEET},
    ]);
    const wrapper = shallowMount(LogMessageComponent, {
      ...globalConfig,
      props: {message, viewModel: fakeViewModel()},
    });

    const html = wrapper.html();
    expect(html).includes('<span class="markdown-resource resource_icon--steel"></span>');
    expect(html).includes(
      '<span class="markdown-production"><span class="markdown-resource resource_icon--heat"></span></span>');
    expect(html).includes('<span class="markdown-resource card-resource-syndicate-fleet"></span>');
  });
});
