import {expect} from 'chai';
import {themeCss, themedSelector, themedValue} from '../../src/tools/themeCss';

describe('themeCss', () => {
  const graphics = {'resources/heat.png': 'graphics/res-water.svg'};

  it('restricts selectors to the theme', () => {
    expect(themedSelector('.card .heat', 'dune')).eq('html.theme-dune .card .heat');
    expect(themedSelector('html.tm-mobile .heat', 'dune')).eq('html.theme-dune.tm-mobile .heat');
  });

  it('replaces only mapped pictures', () => {
    expect(themedValue('url(./assets/resources/heat.png) no-repeat', graphics)).eq('url(graphics/res-water.svg) no-repeat');
    expect(themedValue('url("assets/resources/plant.png")', graphics)).is.undefined;
  });

  it('copies picture rules only, as background-image, inside their media query', () => {
    const css = '.a { background: url(./assets/resources/heat.png) no-repeat; width: 4px; }\n' +
      '@media (max-width: 600px) { .b { background-image: url(./assets/resources/heat.png); } }\n' +
      '.c { color: red; }';
    const result = themeCss(css, 'dune', graphics);
    expect(result).matches(/html\.theme-dune \.a \{\s*background-image: url\(graphics\/res-water\.svg\)\s*\}/);
    expect(result).matches(/@media \(max-width: 600px\) \{\s*html\.theme-dune \.b \{\s*background-image: url\(graphics\/res-water\.svg\)\s*\}\s*\}/);
    expect(result).not.contains('width: 4px');
    expect(result).not.contains('color: red');
  });
});
