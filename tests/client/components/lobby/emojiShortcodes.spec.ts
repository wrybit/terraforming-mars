import {expect} from 'chai';
import {closedShortcode, emojiByName, matchEmojis, openShortcode} from '@/client/components/lobby/emojiShortcodes';
import {CHAT_EMOJI_GROUPS} from '@/client/components/lobby/lobbyChatEmoji';

describe('emojiShortcodes', () => {
  it('gives every emoji of the popover its own name', () => {
    const names = CHAT_EMOJI_GROUPS.flatMap((group) => group.emojis.map((entry) => entry.name));
    expect(new Set(names).size).eq(names.length);
    expect(emojiByName('smile')?.emoji).eq('😄');
    expect(emojiByName('+1')?.emoji).eq('👍');
    expect(emojiByName('nothing')).is.undefined;
  });

  it('finds a started name only at the start or after a space, from two letters', () => {
    expect(openShortcode('Hallo :sm')).deep.eq({start: 6, query: 'sm'});
    expect(openShortcode(':Ro')).deep.eq({start: 0, query: 'ro'});
    expect(openShortcode('Hallo :s')).is.undefined;
    expect(openShortcode('um 20:30')).is.undefined;
  });

  it('replaces a closed name that exists', () => {
    expect(closedShortcode('Super :tada:')).deep.eq({start: 6, emoji: '🎉'});
    expect(closedShortcode('Super :nope:')).is.undefined;
    expect(closedShortcode('12:30:')).is.undefined;
  });

  it('suggests names that begin with the text first', () => {
    const names = matchEmojis('smi').map((entry) => entry.name);
    expect(names[0]).eq('smile');
    expect(names).to.include('smiley');
    expect(matchEmojis('face').map((entry) => entry.name)).to.include('zany_face');
    expect(matchEmojis('a', 8)).has.length.at.most(8);
  });
});
