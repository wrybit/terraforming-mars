import {expect} from 'chai';
import {actionForKeys, duplicateBindings, exportHotkeys, importHotkeys, keysOf, resetBindings, setBinding} from '@/client/hotkeys/hotkeyStore';

describe('hotkeyStore', () => {
  afterEach(() => {
    resetBindings();
  });

  it('finds the action of a key', () => {
    expect(actionForKeys(['J'])).to.equal('tab-projects');
    expect(actionForKeys(['Mod', 'Enter'])).to.equal('create-game');
  });

  it('keeps fixed keys fixed', () => {
    setBinding('confirm', ['X']);
    expect(keysOf('confirm')).to.deep.equal(['Enter']);
  });

  it('reports keys assigned twice', () => {
    expect(duplicateBindings().size).to.equal(0);
    setBinding('tab-projects', ['A']);
    expect(Array.from(duplicateBindings()).sort()).to.deep.equal(['tab-hand', 'tab-projects']);
  });

  it('exports and imports the bindings', () => {
    setBinding('tab-projects', ['Y']);
    const text = exportHotkeys();
    resetBindings();
    expect(importHotkeys(text)).to.be.greaterThan(0);
    expect(keysOf('tab-projects')).to.deep.equal(['Y']);
    expect(() => importHotkeys('{}')).to.throw();
  });
});
