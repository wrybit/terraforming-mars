import {expect} from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import {BoardName} from '../../../src/common/boards/BoardName';
import {EMPTY_RUST_AI_SUPPORT, parseRustAiSupport} from '../../../src/common/ai/RustAiSupport';
import {isRustAiCompatible, rustAiSettingsOf} from '../../../src/common/ai/isRustAiCompatible';
import {NewGameConfig} from '../../../src/common/game/NewGameConfig';
import {RandomMAOptionType} from '../../../src/common/ma/RandomMAOptionType';

const FIXTURE = path.resolve('tests', 'fixtures', 'rust-ai-support-dune.json');

describe('RustAiSupport (Dune)', () => {
  it('knows every ID of the example file with Arrakis and the Dune modules', () => {
    const {support, unknownIds} = parseRustAiSupport(JSON.parse(fs.readFileSync(FIXTURE, 'utf8')));
    expect(unknownIds).deep.eq([]);
    expect(support.boards).deep.eq([BoardName.THARSIS, BoardName.HELLAS, BoardName.ELYSIUM, BoardName.ARRAKIS_61, BoardName.ARRAKIS_91]);
    expect(support.duneModules).deep.eq(['bazaar', 'worm', 'kanly', 'schemes', 'choam', 'goals']);
  });

  it('names Dune modules the new AI cannot play, only in Dune games', () => {
    const support = {...EMPTY_RUST_AI_SUPPORT, expansions: ['corpera'] as const, boards: [BoardName.ARRAKIS_61], duneModules: ['worm']};
    const config = {
      players: [{}, {}], expansions: {corpera: true}, randomMA: RandomMAOptionType.NONE,
      theme: 'dune', duneModules: ['worm', 'kanly'],
    } as unknown as NewGameConfig;
    expect(isRustAiCompatible(rustAiSettingsOf(config, BoardName.ARRAKIS_61), support).reasons).deep.eq([{kind: 'duneModule', id: 'kanly'}]);
    expect(rustAiSettingsOf({...config, theme: 'mars'}, BoardName.THARSIS).duneModules).deep.eq([]);
  });
});
