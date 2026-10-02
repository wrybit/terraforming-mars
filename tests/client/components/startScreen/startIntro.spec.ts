import {expect} from 'chai';
import {shouldPlayIntro} from '@/client/components/startScreen/startIntro';

describe('startIntro', () => {
  it('plays on every load and again after a reload', () => {
    expect(shouldPlayIntro()).to.be.true;
    expect(shouldPlayIntro()).to.be.true;
  });
});
