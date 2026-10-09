import {expect} from 'chai';
import {trimEmptyTextNodes} from '@/client/directives/TrimWhitespace';

describe('TrimWhitespace', () => {
  it('removes whitespace but keeps empty fragment anchors', () => {
    const element = document.createElement('div');
    element.append(document.createTextNode(''), document.createElement('span'), document.createTextNode('  \n '), document.createElement('span'), document.createTextNode(''));
    trimEmptyTextNodes(element);
    expect(Array.from(element.childNodes).map((node) => node.nodeName)).deep.eq(['#text', 'SPAN', 'SPAN', '#text']);
  });
});
