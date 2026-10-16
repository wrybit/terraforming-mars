import {expect} from 'chai';
import {defaultKeys, findHotkeyAction} from '@/client/hotkeys/hotkeyActions';
import {actionForKeys, duplicateBindings, exportHotkeys, importHotkeys, keysOf, resetBindings, setBinding} from '@/client/hotkeys/hotkeyStore';

describe('hotkeyStore', () => {
  afterEach(() => {
    resetBindings();
  });

  it('finds the action of a key', () => {
    expect(actionForKeys(['E'])).to.equal('tab-projects');
    expect(actionForKeys(['='])).to.equal('setup-menu');
    expect(actionForKeys(['Mod', 'Enter'])).to.equal('create-game');
  });

  it('keeps fixed keys fixed', () => {
    setBinding('confirm', ['X']);
    expect(keysOf('confirm')).to.deep.equal(['Enter']);
  });

  it('reports keys assigned twice', () => {
    expect(duplicateBindings().size).to.equal(0);
    setBinding('tab-projects', ['Q']);
    expect(Array.from(duplicateBindings()).sort()).to.deep.equal(['tab-hand', 'tab-projects']);
  });

  it('places the tab keys by position: Y and Z swap between QWERTZ and QWERTY', () => {
    const sell = findHotkeyAction('tab-sell')!;
    expect(defaultKeys(sell, 'de')).to.deep.equal(['Z']);
    expect(defaultKeys(sell, 'en')).to.deep.equal(['Y']);
    expect(defaultKeys(findHotkeyAction('log-search')!, 'de')).to.deep.equal(['-']);
    expect(defaultKeys(findHotkeyAction('log-search')!, 'en')).to.deep.equal(['/']);
  });

  it('exports and imports the bindings', () => {
    setBinding('tab-projects', ['Ö']);
    const text = exportHotkeys();
    resetBindings();
    expect(importHotkeys(text)).to.be.greaterThan(0);
    expect(keysOf('tab-projects')).to.deep.equal(['Ö']);
    expect(() => importHotkeys('{}')).to.throw();
  });
});
