import {expect} from 'chai';
import {rustBotFileName} from '../../../src/server/ai/rust/rustBotPaths';

describe('rustBotPaths', () => {
  it('uses bot.exe on Windows, as the Windows release package ships it', () => {
    expect(rustBotFileName('win32')).eq('bot.exe');
  });

  it('uses bot on every other system', () => {
    expect(rustBotFileName('linux')).eq('bot');
    expect(rustBotFileName('darwin')).eq('bot');
  });
});
