import {expect} from 'chai';
import {browserFamily} from '@/client/components/lobby/notificationSettingsHelp';

describe('notificationSettingsHelp', () => {
  it('tells Safari, Firefox and the Chromium family (Chrome, Arc, Edge) apart', () => {
    expect(browserFamily('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15')).eq('safari');
    expect(browserFamily('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:130.0) Gecko/20100101 Firefox/130.0')).eq('firefox');
    expect(browserFamily('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36')).eq('chromium');
  });

  it('phones: Android and iPhone; an iPad reports itself as a Mac with a touch screen', () => {
    expect(browserFamily('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36')).eq('android');
    expect(browserFamily('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')).eq('ios');
    expect(browserFamily('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', 5)).eq('ios');
  });
});
