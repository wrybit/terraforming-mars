import {expect} from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {EMPTY_RUST_AI_SUPPORT} from '../../../src/common/ai/RustAiSupport';
import {RustAiSupportFile} from '../../../src/server/ai/rust/rustAiSupportFile';

const FIXTURE = path.resolve('tests', 'fixtures', 'rust-ai-support.json');

describe('RustAiSupportFile', () => {
  let folder: string;
  let file: string;
  let warn: typeof console.warn;
  let warnings: Array<string>;

  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'rust-ai-support-'));
    file = path.join(folder, 'rust-ai-support.json');
    warn = console.warn;
    warnings = [];
    console.warn = (message: string) => warnings.push(message);
  });

  afterEach(() => {
    console.warn = warn;
    fs.rmSync(folder, {recursive: true, force: true});
  });

  it('reads the example file', () => {
    fs.copyFileSync(FIXTURE, file);
    const support = new RustAiSupportFile(file).get();
    expect(support.expansions).deep.eq(['corpera', 'prelude', 'prelude2', 'colonies']);
    expect(warnings).deep.eq([]);
  });

  it('supports nothing without a file or with a broken one', () => {
    const reader = new RustAiSupportFile(file);
    expect(reader.get()).deep.eq(EMPTY_RUST_AI_SUPPORT);
    fs.writeFileSync(file, '{"version": 1, "expansions": [');
    expect(reader.get()).deep.eq(EMPTY_RUST_AI_SUPPORT);
    expect(warnings).has.length(1);
  });

  it('reads again once the file changes', () => {
    fs.writeFileSync(file, JSON.stringify({version: 1, expansions: ['venus']}));
    const reader = new RustAiSupportFile(file);
    expect(reader.get().expansions).deep.eq(['venus']);
    fs.writeFileSync(file, JSON.stringify({version: 1, expansions: ['colonies']}));
    const later = new Date(Date.now() + 5000);
    fs.utimesSync(file, later, later);
    expect(reader.get().expansions).deep.eq(['colonies']);
  });

  it('logs an unknown ID once', () => {
    fs.writeFileSync(file, JSON.stringify({version: 1, expansions: ['chess']}));
    const reader = new RustAiSupportFile(file);
    reader.get();
    const later = new Date(Date.now() + 5000);
    fs.utimesSync(file, later, later);
    reader.get();
    expect(warnings.filter((message) => message.includes('chess'))).has.length(1);
  });
});
