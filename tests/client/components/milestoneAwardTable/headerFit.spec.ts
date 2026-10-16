import {expect} from 'chai';
import {iconZoom, observeHeaderFit, OWNER_CUBE_ONLY_CLASS} from '@/client/components/milestoneAwardTable/headerFit';

describe('iconZoom', () => {
  it('never enlarges icons', () => {
    expect(iconZoom(36, 80)).to.eq(1);
  });

  it('shrinks an icon wider than its column', () => {
    expect(iconZoom(76, 42)).to.eq(0.5);
  });

  it('ignores icons without width (images not loaded yet)', () => {
    expect(iconZoom(0, 10)).to.eq(1);
  });
});

describe('observeHeaderFit', () => {
  const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 50));

  // Owner tag whose name is cut off (jsdom has no layout, so the widths are set by hand)
  function truncatedOwner(): HTMLElement {
    const owner = document.createElement('span');
    owner.className = 'ma-table-owner';
    const name = document.createElement('span');
    name.className = 'ma-table-owner-name';
    Object.defineProperty(name, 'scrollWidth', {value: 40});
    Object.defineProperty(name, 'clientWidth', {value: 12});
    owner.appendChild(name);
    return owner;
  }

  it('shows only the cube for an owner added after the start (award funded later)', async () => {
    const table = document.createElement('div');
    document.body.appendChild(table);
    const stop = observeHeaderFit(table);
    await nextFrame();
    const owner = truncatedOwner();
    table.appendChild(owner);
    await nextFrame();
    expect(owner.classList.contains(OWNER_CUBE_ONLY_CLASS)).is.true;
    stop();
    table.remove();
  });
});
