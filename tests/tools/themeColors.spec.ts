import {expect} from 'chai';
import {recolorStylesheet, themedColor, themedColorValue, ThemeColors} from '../../src/tools/themeColors';

describe('themeColors', () => {
  const colors: ThemeColors = {
    families: [
      {name: 'accent', hue: [228, 252], saturation: [0.35, 1], lightness: [0.08, 0.99], toHue: 30, lightnessFactor: 0.8, keepLightAbove: 0.75},
      {name: 'cool', hue: [195, 262], saturation: [0, 0.35], lightness: [0.03, 0.75], toHue: 28, toSaturation: 0.22},
    ],
    text: {minLightness: 0.8, maxSaturation: 0.12, to: '#efdfbf'},
    keepSelectors: ['tone-success'],
  };

  it('turns the app violet into spice orange and leaves greens, reds and player colours alone', () => {
    expect(themedColor([87, 85, 217], colors.families)).deep.eq([197, 121, 44]);
    expect(themedColor([46, 158, 79], colors.families)).is.undefined;
    expect(themedColor([192, 57, 43], colors.families)).is.undefined;
    // Player blue and purple are saturated and outside the accent hues
    expect(themedColor([0, 102, 255], colors.families)).is.undefined;
    expect(themedColor([140, 0, 255], colors.families)).is.undefined;
  });

  it('keeps the alpha and makes light text sand', () => {
    expect(themedColorValue('box-shadow', '0 0 0 5px rgba(87, 85, 217, 0.55)', colors)).eq('0 0 0 5px rgba(197, 121, 44, 0.55)');
    expect(themedColorValue('color', '#fff', colors)).eq('#efdfbf');
    expect(themedColorValue('background', '#fff', colors)).is.undefined;
  });

  it('recolours the whole sheet in place, keeps pass/end rules and points pictures at the app root', () => {
    const css = '.a, .or-tab--tone-success { color: #fff; }\n' +
      '.b { background: url(./assets/tiles/city.png) #5755d9; }\n' +
      '@keyframes pulse { to { box-shadow: 0 0 4px #5755d9; } }';
    const result = recolorStylesheet(css, colors);
    expect(result).contains('.or-tab--tone-success { color: #fff; }');
    expect(result).contains('.a { color: #efdfbf; }');
    expect(result).contains('url(../../../assets/tiles/city.png) rgb(197, 121, 44)');
    expect(result).contains('box-shadow: 0 0 4px rgb(197, 121, 44)');
    // Same order as the game's sheet: kept selectors right before the recoloured rule
    expect(result.indexOf('tone-success')).lessThan(result.indexOf('.a {'));
  });
});
