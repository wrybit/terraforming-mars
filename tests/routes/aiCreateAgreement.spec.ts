import {expect} from 'chai';
import {ApiCreateGame} from '../../src/server/routes/ApiCreateGame';
import {rustOptionsText} from '../../src/server/ai/rust/rustSetup';
import {aiSettingsOf, isAiCompatible} from '../../src/common/ai/aiCompatibility';
import {AI_OPTIONS, AiSupport, EMPTY_AI_SUPPORT} from '../../src/common/ai/aiSupportContract';
import {Expansion} from '../../src/common/cards/GameModule';
import {BoardName} from '../../src/common/boards/BoardName';
import {NewGameConfig} from '../../src/common/game/NewGameConfig';
import {newGameConfigForTest} from './newGameConfigForTest';

// Was die Rust-Spiegelung (rustSetup.ts) spielen kann – so, wie es eine Support-Datei melden würde
const MIRROR_EXPANSIONS: Array<Expansion> = ['corpera', 'prelude', 'prelude2', 'venus', 'colonies', 'turmoil', 'promo'];
const MIRROR_SUPPORT: AiSupport = {
  ...EMPTY_AI_SUPPORT,
  expansions: MIRROR_EXPANSIONS,
  boards: [BoardName.THARSIS],
  options: AI_OPTIONS.filter((option) => !['ceosDraftVariant', 'soloTR', 'modularMA', 'requiresMoonTrackCompletion',
    'moonStandardProjectVariant', 'moonStandardProjectVariant1', 'aresExtremeVariant'].includes(option)),
};

// Zwei Plätze, einer davon KI: so legt die Lobby ein Spiel gegen die KI an
function withAi(): NewGameConfig {
  return {...newGameConfigForTest(), players: [
    {name: 'Mensch', color: 'red', beginner: false, handicap: 0, first: true},
    {name: 'Bot', color: 'blue', beginner: false, handicap: 0, first: false, aiLevel: 'hard'},
  ]};
}

// Alle An/Aus-Schalter des Formulars: auch die, die das Formular ausblendet, aber im Hintergrund gesetzt lässt
const SWITCHES = Object.entries(withAi())
  .filter(([, value]) => typeof value === 'boolean')
  .map(([key]) => key as keyof NewGameConfig);

function variants(): Array<{label: string, config: NewGameConfig}> {
  const result: Array<{label: string, config: NewGameConfig}> = [];
  for (const initialDraft of [false, true]) {
    for (const expansion of [undefined, ...MIRROR_EXPANSIONS.filter((id) => id !== 'corpera')]) {
      for (const option of SWITCHES) {
        const config = withAi();
        config.draftVariant = true;
        config.initialDraft = initialDraft;
        if (expansion !== undefined) {
          config.expansions = {...config.expansions, [expansion]: true};
        }
        (config as unknown as Record<string, unknown>)[option] = true;
        result.push({label: `${option}, initialDraft ${initialDraft}, expansion ${expansion ?? 'none'}`, config});
      }
    }
  }
  return result;
}

/**
 * Regel: Sagt die Prüfung des Formulars "KI möglich", muss der Server das Spiel auch anlegen.
 * Fehlt das, zeigt das Formular grün und der Start scheitert (26.11.2026: ceosDraftVariant ohne CEO-Erweiterung).
 */
describe('AI create agreement: form check and Rust mirror', () => {
  for (const {label, config} of variants()) {
    it(`what the form allows, the server starts (${label})`, () => {
      const formCheck = isAiCompatible(aiSettingsOf(config, BoardName.THARSIS), MIRROR_SUPPORT);
      if (!formCheck.ok) {
        return;
      }
      const mirror = rustOptionsText(ApiCreateGame.gameOptions(config, BoardName.THARSIS), config.players.length);
      expect(mirror, 'form says AI is fine, server refuses').not.to.have.property('unsupported');
    });
  }
});
