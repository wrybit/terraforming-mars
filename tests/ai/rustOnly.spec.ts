import {expect} from 'chai';
import {aiAdminSettings} from '../../src/server/ai/aiEngineChoice';
import {serverSettingDefinition} from '../../src/common/admin/serverSettings';

// Only the Rust AI plays: no .env value and no admin setting may bring back the TypeScript AI
describe('Rust AI only', () => {
  const keys = ['AI_ENGINE', 'AI_TYPESCRIPT_FALLBACK'] as const;
  const previous: Record<string, string | undefined> = {};

  beforeEach(() => keys.forEach((key) => previous[key] = process.env[key]));
  afterEach(() => keys.forEach((key) => {
    if (previous[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previous[key];
    }
  }));

  it('ignores an old .env that asks for the TypeScript AI', () => {
    process.env.AI_ENGINE = 'typescript';
    process.env.AI_TYPESCRIPT_FALLBACK = 'true';
    expect(aiAdminSettings()).deep.eq({engine: 'rust', typescriptFallback: false});
  });

  it('is Rust without any setting', () => {
    keys.forEach((key) => delete process.env[key]);
    expect(aiAdminSettings()).deep.eq({engine: 'rust', typescriptFallback: false});
  });

  it('offers no admin switch for the TypeScript AI', () => {
    expect(serverSettingDefinition('AI_ENGINE')).is.undefined;
    expect(serverSettingDefinition('AI_TYPESCRIPT_FALLBACK')).is.undefined;
  });
});
