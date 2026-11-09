import {expect} from 'chai';
import {BOT_ACCOUNTS, botAccountOf} from '../../../src/common/ai/botAccounts';

describe('botAccounts', () => {
  it('names and colours one account per strength', () => {
    expect(BOT_ACCOUNTS.map((account) => `${account.name} ${account.color}`)).deep.eq(['Bot [AI-] yellow', 'Bot [AI] orange', 'Bot [AI+] red']);
  });

  it('finds the account of an AI name, none for humans', () => {
    expect(botAccountOf('Paul [AI+]')?.name).eq('Bot [AI+]');
    expect(botAccountOf('Stilgar (KI)')?.name).eq('Bot [AI]');
    expect(botAccountOf('Jens')).is.undefined;
  });
});
