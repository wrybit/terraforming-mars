// Theme colours (Jens: "the UI colours of the app should look like Dune – sand and Arrakis rock, dark brown and sand
// yellow – but pass and end stay as on Mars"). Like the pictures (themeCss.ts) the colours are derived from the game's
// compiled styles: every rule of build/styles.css whose colours fall into a family of src/themes/<theme>/colors.json
// gets a copy under html.theme-<theme> with the theme colours. New uses of the app colours are themed automatically;
// Mars keeps its stylesheet untouched.
import postcss, {Declaration, Rule} from 'postcss';

/** Colours whose hue, saturation and lightness lie in the ranges are turned to the target hue. */
export type ColorFamily = {
  /** For the reader of colors.json: what the family is */
  name: string;
  /** Hue in degrees, inclusive */
  hue: [number, number];
  saturation: [number, number];
  lightness: [number, number];
  toHue: number;
  /** Saturation of the result; absent = the original saturation */
  toSaturation?: number;
  /** Lightness of the result = lightness × factor (only below keepLightAbove, light tints keep their lightness) */
  lightnessFactor?: number;
  keepLightAbove?: number;
};

export type ThemeColors = {
  families: ReadonlyArray<ColorFamily>;
  /** Light, almost grey text colours (property "color" only) become this colour – the sand of the theme */
  text?: {minLightness: number, maxSaturation: number, to: string};
  /** Rules whose selector contains one of these stay as they are (e.g. pass and end) */
  keepSelectors?: ReadonlyArray<string>;
};

type Rgb = [number, number, number];

const COLOR_PATTERN = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+%?)\s*)?\)/g;
const COLOR_PROPERTIES = /^(color|background|background-color|background-image|border|border-(top|right|bottom|left)(-color)?|border-color|outline|outline-color|box-shadow|text-shadow|fill|stroke|caret-color|accent-color|--.*)$/;

function toHsl([r, g, b]: Rgb): [number, number, number] {
  const red = r / 255; const green = g / 255; const blue = b / 255;
  const max = Math.max(red, green, blue); const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  if (max === min) {
    return [0, 0, lightness];
  }
  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue: number;
  if (max === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }
  return [hue * 60, saturation, lightness];
}

function toRgb(hue: number, saturation: number, lightness: number): Rgb {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = lightness - chroma / 2;
  const [r, g, b] = hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x] :
    hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return [r, g, b].map((value) => Math.round((value + m) * 255)) as Rgb;
}

function inRange(value: number, [low, high]: [number, number]): boolean {
  return value >= low && value <= high;
}

/** The colour in the theme, or undefined when no family takes it. */
export function themedColor(rgb: Rgb, families: ReadonlyArray<ColorFamily>): Rgb | undefined {
  const [hue, saturation, lightness] = toHsl(rgb);
  const family = families.find((candidate) =>
    inRange(hue, candidate.hue) && inRange(saturation, candidate.saturation) && inRange(lightness, candidate.lightness));
  if (family === undefined) {
    return undefined;
  }
  const keepLight = family.keepLightAbove !== undefined && lightness > family.keepLightAbove;
  const newLightness = keepLight ? lightness : Math.min(1, lightness * (family.lightnessFactor ?? 1));
  return toRgb(family.toHue, family.toSaturation ?? saturation, newLightness);
}

function parse(match: RegExpExecArray | Array<string | undefined>): {rgb: Rgb, alpha: string | undefined} {
  if (match[1] !== undefined) {
    const hex = match[1].length === 3 ? match[1].split('').map((digit) => digit + digit).join('') : match[1];
    return {rgb: [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16)) as Rgb, alpha: undefined};
  }
  return {rgb: [Number(match[2]), Number(match[3]), Number(match[4])], alpha: match[5]};
}

function write(rgb: Rgb, alpha: string | undefined): string {
  return alpha === undefined ? `rgb(${rgb.join(', ')})` : `rgba(${rgb.join(', ')}, ${alpha})`;
}

/** The value with every themed colour replaced; undefined when it holds none. */
export function themedColorValue(property: string, value: string, colors: ThemeColors): string | undefined {
  let changed = false;
  const result = value.replace(COLOR_PATTERN, (...match: Array<string | undefined>) => {
    const {rgb, alpha} = parse(match);
    const [, saturation, lightness] = toHsl(rgb);
    const text = colors.text;
    if (property === 'color' && text !== undefined && lightness >= text.minLightness && saturation <= text.maxSaturation) {
      changed = true;
      return text.to;
    }
    const themed = themedColor(rgb, colors.families);
    if (themed === undefined) {
      return match[0] ?? '';
    }
    changed = true;
    return write(themed, alpha);
  });
  return changed ? result : undefined;
}

// Relative pictures and fonts of the game's styles (url(./assets/…)): the recoloured copy is served from
// assets/themes/<theme>/, three folders below the app root
const RELATIVE_URL = /url\((['"]?)(?!data:|https?:|\/|#)(?:\.\/)?([^'")]+)\1\)/g;

function fromThemeFolder(value: string): string {
  return value.replace(RELATIVE_URL, (_match, quote: string, file: string) => `url(${quote}../../../${file}${quote})`);
}

/**
 * The whole stylesheet in the theme colours. It replaces the game's stylesheet while the theme is shown
 * (client/theme/applyTheme.ts), so order and weight of every rule stay exactly as in the Mars styles – copies with
 * an html.theme-… prefix would outweigh rules that override them later (e.g. the body text colour).
 */
export function recolorStylesheet(css: string, colors: ThemeColors): string {
  const root = postcss.parse(css);
  const kept = colors.keepSelectors ?? [];
  // Keyframes too (e.g. the pulsing selection frame): the copy replaces the game's stylesheet, nothing competes
  root.walkRules((rule: Rule) => {
    // Rules for pass and end (and the like) keep their colours: split them off unchanged
    const keptSelectors = rule.selectors.filter((selector) => kept.some((part) => selector.includes(part)));
    if (keptSelectors.length > 0) {
      if (keptSelectors.length === rule.selectors.length) {
        return;
      }
      rule.cloneBefore({selectors: keptSelectors});
      rule.selectors = rule.selectors.filter((selector) => !keptSelectors.includes(selector));
    }
    rule.walkDecls((declaration: Declaration) => {
      if (!COLOR_PROPERTIES.test(declaration.prop)) {
        return;
      }
      const value = themedColorValue(declaration.prop, declaration.value, colors);
      if (value !== undefined) {
        declaration.value = value;
      }
    });
  });
  root.walkDecls((declaration: Declaration) => {
    if (declaration.value.includes('url(')) {
      declaration.value = fromThemeFolder(declaration.value);
    }
  });
  root.walkAtRules('font-face', (fontFace) => fontFace.walkDecls('src', (declaration) => {
    declaration.value = fromThemeFolder(declaration.value);
  }));
  return `/* Generated by src/tools/themeColors.ts from build/styles.css and colors.json – do not edit. */\n${root.toString()}`;
}
