import {expect} from 'chai';
import {encodeSettingsLink} from '@/client/components/create/settingsLink/encodeSettingsLink';
import {decodeSettingsLink} from '@/client/components/create/settingsLink/decodeSettingsLink';
import {codeTableValues} from '@/client/components/create/settingsLink/settingsLinkCodes';
import {readSettingsFromHash, settingsHash} from '@/client/components/create/settingsLink/settingsLinkHash';
import {defaultCreateGameModel} from '@/client/components/create/defaultCreateGameModel';
import {CreateGameModel} from '@/client/components/create/CreateGameModel';
import {JSONProcessor} from '@/client/components/create/JSONProcessor';
import {BoardName} from '@/common/boards/BoardName';
import {RandomBoardOption} from '@/common/boards/RandomBoardOption';
import {CardName} from '@/common/cards/CardName';
import {EXPANSIONS} from '@/common/cards/GameModule';
import {ColonyName} from '@/common/colonies/ColonyName';
import {PLAYER_COLORS} from '@/common/Color';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';

function sampleModel(): CreateGameModel {
  const model = defaultCreateGameModel();
  model.playersCount = 3;
  model.players[0].name = 'Jens';
  model.players[1].name = 'Daniel';
  model.players[1].color = 'purple';
  model.players[1].beginner = true;
  model.players[2].name = 'Märtin';
  model.players[2].handicap = 4;
  model.expansions = {...model.expansions, corpera: true, prelude: true, venus: true, colonies: true, turmoil: true};
  model.board = BoardName.HELLAS;
  model.startingCorporations = 4;
  model.draftVariant = true;
  model.solarPhaseOption = true;
  model.politicalAgendasExtension = 'Chairman';
  model.randomMA = RandomMAOptionType.LIMITED;
  model.firstIndex = 2;
  model.randomFirstPlayer = false;
  return model;
}

// Reads a link like the form does: via the JSONProcessor into a fresh model
function applyLink(text: string): {model: CreateGameModel, warnings: Array<string>} {
  const model = defaultCreateGameModel();
  const processor = new JSONProcessor(model);
  processor.applyJSON(decodeSettingsLink(text));
  return {model, warnings: processor.warnings};
}

describe('settings link', () => {
  it('stays short for a typical game', () => {
    expect(encodeSettingsLink(sampleModel()).length).lessThan(70);
  });

  it('round-trips all settings through the form import', () => {
    const original = sampleModel();
    const {model, warnings} = applyLink(encodeSettingsLink(original));

    expect(warnings).deep.eq([]);
    expect(model.playersCount).eq(3);
    expect(model.players.slice(0, 3)).deep.eq(original.players.slice(0, 3));
    expect(model.expansions).deep.eq(original.expansions);
    expect(model.board).eq(BoardName.HELLAS);
    expect(model.startingCorporations).eq(4);
    expect(model.politicalAgendasExtension).eq('Chairman');
    expect(model.randomMA).eq(RandomMAOptionType.LIMITED);
    expect(model.firstIndex).eq(2);
    expect(model.randomFirstPlayer).is.false;
    expect(model.draftVariant).is.true;
    expect(model.escapeVelocityMode).is.false;
  });

  it('round-trips card lists, colonies and escape velocity', () => {
    const original = sampleModel();
    original.bannedCards = [CardName.MOHOLE_AREA, CardName.ANTS];
    original.includedCards = [CardName.BIRDS];
    original.customCorporations = [CardName.ECOLINE, CardName.THARSIS_REPUBLIC];
    original.customColonies = [ColonyName.EUROPA, ColonyName.IO, ColonyName.LUNA];
    original.escapeVelocityMode = true;
    original.escapeVelocityThreshold = 40;
    original.escapeVelocityPenalty = 2;

    const {model} = applyLink(encodeSettingsLink(original));

    expect(model.bannedCards).deep.eq(original.bannedCards);
    expect(model.includedCards).deep.eq(original.includedCards);
    expect(model.customCorporations).deep.eq(original.customCorporations);
    expect(model.customColonies).deep.eq(original.customColonies);
    expect(model.escapeVelocityMode).is.true;
    expect(model.escapeVelocityThreshold).eq(40);
    expect(model.escapeVelocityPenalty).eq(2);
  });

  it('keeps unknown card names as text', () => {
    const original = sampleModel();
    original.bannedCards = ['Some Future Card' as CardName];
    const json = decodeSettingsLink(encodeSettingsLink(original));
    expect(json.bannedCards).deep.eq(['Some Future Card']);
  });

  it('gives duplicate colors a free one so the link still loads', () => {
    const original = sampleModel();
    original.players[1].color = original.players[0].color;
    const {model} = applyLink(encodeSettingsLink(original));
    const colors = model.players.slice(0, 3).map((player) => player.color);
    expect(new Set(colors).size).eq(3);
  });

  it('rejects other format versions', () => {
    expect(() => decodeSettingsLink('Ag')).to.throw(/version/);
  });

  it('only reads its own hash', () => {
    expect(readSettingsFromHash('')).is.undefined;
    expect(readSettingsFromHash('#rules')).is.undefined;
    const hash = settingsHash(sampleModel());
    expect(hash.startsWith('#s=')).is.true;
    expect(readSettingsFromHash(hash)?.board).eq(BoardName.HELLAS);
  });

  // If a value is missing from settingsLinkCodes.json, it is encoded as text – that works, but makes links longer
  it('has a code for every current value (run npm run make:linkcodes otherwise)', () => {
    const expected: Record<string, ReadonlyArray<string>> = {
      boards: [...Object.values(BoardName), ...Object.values(RandomBoardOption)],
      expansions: EXPANSIONS,
      colors: PLAYER_COLORS,
      randomMilestones: Object.values(RandomMAOptionType),
      agendas: ['Standard', 'Random', 'Chairman'],
      cards: Object.values(CardName),
      colonies: Object.values(ColonyName),
    };
    for (const [table, values] of Object.entries(expected)) {
      const codes = new Set(codeTableValues(table as Parameters<typeof codeTableValues>[0]));
      expect(values.filter((value) => !codes.has(value)), table).deep.eq([]);
    }
  });
});
