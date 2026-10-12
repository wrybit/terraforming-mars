import {expect} from 'chai';
import {browserName, operatingSystem, shareableUrl} from '@/client/utils/browserEnvironment';
import {ViewModel} from '@/common/models/PlayerModel';

const CHROME_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const SAFARI_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const EDGE_WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0';
const FIREFOX_ANDROID = 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0';

describe('browserEnvironment', () => {
  it('names browser and version', () => {
    expect(browserName(CHROME_MAC)).eq('Chrome 141');
    expect(browserName(SAFARI_IPHONE)).eq('Safari 18.1');
    expect(browserName(EDGE_WINDOWS)).eq('Edge 141');
    expect(browserName(FIREFOX_ANDROID)).eq('Firefox 131');
  });

  it('names the operating system', () => {
    expect(operatingSystem(CHROME_MAC)).eq('macOS');
    expect(operatingSystem(SAFARI_IPHONE)).eq('iOS 18.1');
    expect(operatingSystem(EDGE_WINDOWS)).eq('Windows 10/11');
    expect(operatingSystem(FIREFOX_ANDROID)).eq('Android 14');
  });

  it('turns a player link into the spectator link', () => {
    const view = {game: {spectatorId: 'sabc'}} as unknown as ViewModel;
    expect(shareableUrl(view, 'https://tm.example/player?id=p123').toString()).eq('https://tm.example/spectator?id=sabc');
    expect(shareableUrl(undefined, 'https://tm.example/cards').toString()).eq('https://tm.example/cards');
  });
});
