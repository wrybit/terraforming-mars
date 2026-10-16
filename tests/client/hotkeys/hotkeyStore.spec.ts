import {expect} from 'chai';
import {actionForKeys, duplicateBindings, exportHotkeys, importHotkeys, keysOf, resetBindings, setBinding} from '@/client/hotkeys/hotkeyStore';

describe('hotkeyStore', () => {
  afterEach(() => {
    resetBindings();
  });

  it('finds the action of a key', () => {
    expect(actionForKeys(['KeyE'])).to.equal('tab-projects');
    expect(actionForKeys(['Backquote'])).to.equal('setup-menu');
    expect(actionForKeys(['Mod', 'Enter'])).to.equal('create-game');
  });

  it('keeps fixed keys fixed', () => {
    setBinding('confirm', ['KeyX']);
    expect(keysOf('confirm')).to.deep.equal(['Enter']);
  });

  it('reports keys assigned twice', () => {
    expect(duplicateBindings().size).to.equal(0);
    setBinding('tab-projects', ['KeyQ']);
    expect(Array.from(duplicateBindings()).sort()).to.deep.equal(['tab-hand', 'tab-projects']);
  });

  it('binds single keys by position and combinations by character', () => {
    expect(keysOf('tab-sell')).to.deep.equal(['KeyY']);
    expect(keysOf('setup-menu')).to.deep.equal(['Backquote']);
    expect(keysOf('undo')).to.deep.equal(['Mod', 'Z']);
  });

  it('exports and imports the bindings', () => {
    setBinding('tab-projects', ['Semicolon']);
    const text = exportHotkeys();
    resetBindings();
    expect(importHotkeys(text)).to.be.greaterThan(0);
    expect(keysOf('tab-projects')).to.deep.equal(['Semicolon']);
    expect(() => importHotkeys('{}')).to.throw();
  });
});
