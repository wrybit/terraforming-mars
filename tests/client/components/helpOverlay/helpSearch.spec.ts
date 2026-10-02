import {expect} from 'chai';
import {applyHelpSearch, HELP_HIDDEN_ATTRIBUTE} from '@/client/components/helpOverlay/helpSearch';

describe('applyHelpSearch', () => {
  function fixture(): HTMLElement {
    const root = document.createElement('div');
    root.innerHTML = `
      <section class="scope"><h3>Gruppe A</h3><p class="item">Schweber</p><p class="item">Tier</p></section>
      <section class="scope"><h3>Gruppe B</h3><p class="item">Stahl</p></section>`;
    return root;
  }
  const config = {
    items: (root: HTMLElement) => Array.from(root.querySelectorAll('.item')),
    scopes: (root: HTMLElement) => Array.from(root.querySelectorAll('.scope')),
  };
  const hidden = (root: HTMLElement) => Array.from(root.querySelectorAll(`[${HELP_HIDDEN_ATTRIBUTE}]`)).map((element) => element.textContent?.trim());

  it('hides non-matching items and empty scopes', () => {
    const root = fixture();
    expect(applyHelpSearch(root, config, 'schw')).eq(1);
    const items = root.querySelectorAll('.item');
    expect(items[0].hasAttribute(HELP_HIDDEN_ATTRIBUTE)).is.false;
    expect(items[1].hasAttribute(HELP_HIDDEN_ATTRIBUTE)).is.true;
    expect(root.querySelectorAll('.scope')[0].hasAttribute(HELP_HIDDEN_ATTRIBUTE)).is.false;
    expect(root.querySelectorAll('.scope')[1].hasAttribute(HELP_HIDDEN_ATTRIBUTE)).is.true;
  });

  it('shows everything again for an empty query', () => {
    const root = fixture();
    applyHelpSearch(root, config, 'stahl');
    expect(applyHelpSearch(root, config, '')).eq(3);
    expect(hidden(root)).deep.eq([]);
  });

  it('hides headings whose following group has no match', () => {
    const root = document.createElement('div');
    root.innerHTML = '<h2>Grundspiel</h2><div class="item">Stadt</div><h2>Fan</h2><div class="item">Mond</div>';
    const headingConfig = {
      items: (element: HTMLElement) => Array.from(element.querySelectorAll('.item')),
      headings: (element: HTMLElement) => Array.from(element.querySelectorAll('h2')),
    };
    applyHelpSearch(root, headingConfig, 'mond');
    expect(root.querySelectorAll('h2')[0].hasAttribute(HELP_HIDDEN_ATTRIBUTE)).is.true;
    expect(root.querySelectorAll('h2')[1].hasAttribute(HELP_HIDDEN_ATTRIBUTE)).is.false;
  });
});
