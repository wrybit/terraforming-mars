import {expect} from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import {BoardName} from '../../../src/common/boards/BoardName';
import {EMPTY_RUST_AI_SUPPORT, parseRustAiSupport} from '../../../src/common/ai/RustAiSupport';

const FIXTURE = path.resolve('tests', 'fixtures', 'rust-ai-support.json');

describe('RustAiSupport', () => {
  it('knows every ID of the example file', () => {
    const {support, unknownIds} = parseRustAiSupport(JSON.parse(fs.readFileSync(FIXTURE, 'utf8')));
    expect(unknownIds).deep.eq([]);
    expect(support.expansions).deep.eq(['corpera', 'prelude', 'prelude2', 'colonies']);
    expect(support.boards).deep.eq([BoardName.THARSIS, BoardName.HELLAS, BoardName.ELYSIUM]);
    expect(support.options).deep.eq(['draftVariant', 'initialDraftVariant', 'preludeDraftVariant']);
    expect(support.botVersion).eq('test-build');
  });

  it('leaves out unknown IDs and reports them', () => {
    const {support, unknownIds} = parseRustAiSupport({
      version: 1, expansions: ['venus', 'chess'], boards: ['Utopia Planitia', 'atlantis'], options: ['showTimers', 'soloTR'],
    });
    expect(support.expansions).deep.eq(['venus']);
    expect(support.boards).deep.eq([BoardName.UTOPIA_PLANITIA]);
    expect(support.options).deep.eq(['soloTR']);
    expect(unknownIds).deep.eq(['expansions: chess', 'boards: atlantis', 'options: showTimers']);
  });

  it('accepts board slugs', () => {
    expect(parseRustAiSupport({version: 1, boards: ['utopia-planitia']}).support.boards).deep.eq([BoardName.UTOPIA_PLANITIA]);
  });

  it('supports nothing for broken content or another version', () => {
    for (const raw of [undefined, null, 'text', [], {version: 2, expansions: ['venus']}]) {
      expect(parseRustAiSupport(raw).support).deep.eq(EMPTY_RUST_AI_SUPPORT);
    }
  });

  it('treats missing lists as empty', () => {
    expect(parseRustAiSupport({version: 1}).support).deep.eq(EMPTY_RUST_AI_SUPPORT);
  });
});
