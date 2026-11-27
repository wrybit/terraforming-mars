import {flushPromises, mount} from '@vue/test-utils';
import {expect} from 'chai';
import {vi} from 'vitest';
import {globalConfig} from '../getLocalVue';
import TrainingShareReceiverRow from '@/client/components/admin/TrainingShareReceiverRow.vue';
import {TRAINING_SHARE_RECEIVER_URL, TrainingShareResult} from '@/common/trainingShare/TrainingShareModel';

function mountAnswering(answer: TrainingShareResult) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(answer), {status: 200}));
  vi.stubGlobal('fetch', fetchMock);
  return {wrapper: mount(TrainingShareReceiverRow, globalConfig), fetchMock};
}

describe('TrainingShareReceiverRow', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows the fixed receiver read-only', () => {
    const {wrapper} = mountAnswering({ok: true});
    const input = wrapper.find('input').element as HTMLInputElement;
    expect(input.readOnly).is.true;
    expect(input.value).eq('terraforming-mars.baiz.org');
    expect(input.title).eq(TRAINING_SHARE_RECEIVER_URL);
    expect(wrapper.find('.training-share-test').exists()).is.false;
  });

  it('tests the connection and says that the receiver can be reached', async () => {
    const {wrapper, fetchMock} = mountAnswering({ok: true});
    await wrapper.find('button').trigger('click');
    await flushPromises();
    expect(JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, {body: string}])[1].body))).deep.eq({test: true});
    expect(wrapper.find('.training-share-test--ok').text()).to.include('The receiver can be reached.');
  });

  it('names the reason when the receiver cannot be reached', async () => {
    const {wrapper} = mountAnswering({ok: false, message: 'terraforming-mars.baiz.org cannot be reached (ETIMEDOUT).'});
    await wrapper.find('button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.training-share-test--failed').text()).to.include('ETIMEDOUT');
  });
});
