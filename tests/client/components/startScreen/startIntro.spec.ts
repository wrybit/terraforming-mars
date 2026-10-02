import {expect} from 'chai';
import {markIntroSeen, shouldPlayIntro} from '@/client/components/startScreen/startIntro';

describe('startIntro', () => {
  beforeEach(() => sessionStorage.clear());

  it('plays once per browser session', () => {
    expect(shouldPlayIntro()).to.be.true;
    markIntroSeen();
    expect(shouldPlayIntro()).to.be.false;
  });
});
