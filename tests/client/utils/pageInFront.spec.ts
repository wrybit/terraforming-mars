import {expect} from 'chai';
import {afterEach, describe, it, vi} from 'vitest';
import {isPageInFront} from '@/client/utils/pageInFront';

describe('isPageInFront', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setPage(visibility: 'visible' | 'hidden', focused: boolean) {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(visibility);
    vi.spyOn(document, 'hasFocus').mockReturnValue(focused);
  }

  it('visible and focused', () => {
    setPage('visible', true);
    expect(isPageInFront()).is.true;
  });

  it('visible, but another window in front', () => {
    setPage('visible', false);
    expect(isPageInFront()).is.false;
  });

  it('hidden tab', () => {
    setPage('hidden', false);
    expect(isPageInFront()).is.false;
  });
});
