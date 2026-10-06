import {expect} from 'chai';
import {parseWikiUrl, renderWikiPage, wikiExcerpt, wikiSection} from '@/client/components/create/wikiContent';

const PAGE = `# Variants

## Official Variants
### Draft
Players draft their cards each generation instead of drawing them directly.

### Initial Draft
[Rules](https://example.com) | [Video](https://example.com)

Adds a draft mechanic for starting cards before the game begins.
<script>alert(1)</script>
`;

describe('wikiContent', () => {
  it('parses wiki links only', () => {
    expect(parseWikiUrl('https://github.com/terraforming-mars/terraforming-mars/wiki/Variants#initial-draft')).deep.eq({page: 'Variants', anchor: 'initial-draft'});
    expect(parseWikiUrl('https://github.com/terraforming-mars/terraforming-mars/discussions/7647')).is.undefined;
  });

  it('takes the first prose paragraph of the section, skipping link lines', () => {
    expect(wikiExcerpt(wikiSection(PAGE, 'initial-draft'))).eq('Adds a draft mechanic for starting cards before the game begins.');
    expect(wikiExcerpt(wikiSection(PAGE, 'draft'))).eq('Players draft their cards each generation instead of drawing them directly.');
  });

  it('renders the page without scripts and moves the title out', () => {
    const page = renderWikiPage(PAGE);
    expect(page.title).eq('Variants');
    expect(page.html).not.contains('<script');
    expect(page.html).contains('id="wiki-initial-draft"');
  });
});
