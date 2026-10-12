import {expect} from 'chai';
import {isTypingTarget} from '@/client/utils/typingTarget';

describe('typingTarget', () => {
  it('knows fields that take text', () => {
    expect(isTypingTarget(document.createElement('input'))).is.true;
    expect(isTypingTarget(document.createElement('textarea'))).is.true;
    expect(isTypingTarget(document.createElement('select'))).is.true;
    expect(isTypingTarget(document.createElement('div'))).is.false;
    expect(isTypingTarget(null)).is.false;
  });
});
