import {GlyphName} from '@/client/components/mobile/mobileGlyphs';

// Icon of an action in the turn sheet of the phone (turnMenu.ts) and in the narrowest action tab bar (TabSteps.ts):
// one picture per action everywhere. The tone is the color of the phone's icon tile (mobile.less).
export type ActionGlyphTone = 'cards' | 'megacredits' | 'plants' | 'heat' | 'honors' | 'colonies' | 'neutral';

export type ActionLook = {glyph: GlyphName, glyphTone: ActionGlyphTone};

// Icon and color per title key
const ACTION_LOOKS: Readonly<Record<string, ActionLook>> = {
  'Claim a milestone': {glyph: 'milestone', glyphTone: 'honors'},
  'Convert ${0} plants into greenery': {glyph: 'greenery', glyphTone: 'plants'},
  'Convert 8 heat into temperature': {glyph: 'temperature', glyphTone: 'heat'},
  'Convert 6 heat into temperature': {glyph: 'temperature', glyphTone: 'heat'},
  'Perform an action from a played card': {glyph: 'cardActions', glyphTone: 'cards'},
  'Play project card': {glyph: 'playCard', glyphTone: 'cards'},
  'Fund an award (${0} M€)': {glyph: 'award', glyphTone: 'honors'},
  'Standard projects': {glyph: 'standardProjects', glyphTone: 'megacredits'},
  'Sell patents': {glyph: 'sellPatents', glyphTone: 'megacredits'},
  'Trade with a colony tile': {glyph: 'colonyTrade', glyphTone: 'colonies'},
};

// Undefined: the action has no icon of its own (expansions); the tab keeps its word, the phone a neutral icon
export function actionLook(titleKey: string): ActionLook | undefined {
  return ACTION_LOOKS[titleKey];
}
