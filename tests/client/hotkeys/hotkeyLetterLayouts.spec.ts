import {expect} from 'chai';
import {guessLetterLayout, layoutOfKey, letterAt, letterLayout, letterLayoutGuessed, recognizeLetterLayout, resetLetterLayout, setLetterLayoutChoice} from '@/client/hotkeys/hotkeyLetterLayouts';
import {safeLocalStorage} from '@/client/utils/SafeLocalStorage';

describe('hotkeyLetterLayouts', () => {
  afterEach(() => {
    resetLetterLayout();
  });

  it('knows the letters of each layout', () => {
    expect(letterAt('KeyQ', 'azerty')).to.equal('A');
    expect(letterAt('Semicolon', 'azerty')).to.equal('M');
    expect(letterAt('KeyY', 'qwertz')).to.equal('Z');
    expect(letterAt('KeyE', 'qwertz')).to.equal('E');
    expect(letterAt('Semicolon', 'qwerty')).to.equal(undefined);
  });

  it('guesses from the first language with its own layout', () => {
    expect(guessLetterLayout(['fr-FR'])).to.equal('azerty');
    expect(guessLetterLayout(['fr-CA', 'fr'])).to.equal('qwerty');
    expect(guessLetterLayout(['fr-CH'])).to.equal('qwertz');
    expect(guessLetterLayout(['de-AT'])).to.equal('qwertz');
    expect(guessLetterLayout(['en-US', 'de'])).to.equal('qwertz');
    expect(guessLetterLayout(['en-US', 'en'])).to.equal('qwerty');
  });

  it('recognizes the layout from a single telling key', () => {
    expect(layoutOfKey('KeyQ', 'a')).to.equal('azerty');
    expect(layoutOfKey('KeyY', 'z')).to.equal('qwertz');
    expect(layoutOfKey('KeyZ', 'Z')).to.equal('qwerty');
    expect(layoutOfKey('KeyE', 'e')).to.equal(undefined);
    expect(layoutOfKey('KeyQ', 'ä')).to.equal(undefined);
  });

  it('remembers the recognized layout until the player picks one', () => {
    expect(letterLayoutGuessed.value).to.be.true;
    recognizeLetterLayout('KeyW', 'z');
    expect(letterLayout.value).to.equal('azerty');
    expect(letterLayoutGuessed.value).to.be.false;
    expect(safeLocalStorage.getItem('hotkeys-keyboard-layout')).to.equal('auto:azerty');

    setLetterLayoutChoice('qwertz');
    recognizeLetterLayout('KeyQ', 'q');
    expect(letterLayout.value).to.equal('qwertz');
    expect(safeLocalStorage.getItem('hotkeys-keyboard-layout')).to.equal('qwertz');
  });
});
