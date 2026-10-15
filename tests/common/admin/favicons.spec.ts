import {expect} from 'chai';
import fs from 'fs';
import {FAVICON_COLORS, FAVICON_ICONS, faviconFile, faviconImage} from '../../../src/common/admin/favicons';

describe('favicons', () => {
  it('has a generated picture for every icon in every color (scripts/make-favicons.py)', () => {
    expect(FAVICON_ICONS).has.length(5);
    expect(FAVICON_COLORS).has.length(10);
    for (const icon of FAVICON_ICONS) {
      for (const color of FAVICON_COLORS) {
        expect(fs.existsSync(faviconImage(icon.id, color.id)), icon.id + '-' + color.id).is.true;
      }
    }
  });

  it('serves the original for the default, empty and unknown values', () => {
    for (const [icon, color] of [[undefined, undefined], ['', ''], ['mars', 'orange'], ['moon', 'purple-ish']]) {
      expect(faviconFile(icon, color), `${icon}/${color}`).eq('assets/favicon.ico');
    }
    expect(faviconFile('city', undefined)).eq('assets/favicon/city-orange.png');
    expect(faviconFile(undefined, 'green')).eq('assets/favicon/mars-green.png');
    expect(faviconFile('astronaut', 'typo')).eq('assets/favicon/astronaut-orange.png');
  });
});
