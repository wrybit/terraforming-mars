import {expect} from 'chai';
import {serverIdentity, withServerIdentity} from '../../src/server/server/serverIdentity';

describe('serverIdentity', () => {
  it('falls back to the defaults', () => {
    expect(serverIdentity({})).to.deep.eq({titleLong: 'Terraforming Mars', titleShort: 'TM', name: ''});
    expect(serverIdentity({TITLE_LONG: ' ', TITLE_SHORT: ''})).to.deep.eq({titleLong: 'Terraforming Mars', titleShort: 'TM', name: ''});
  });

  it('reads the environment', () => {
    expect(serverIdentity({TITLE_LONG: 'TM | Meenzer-Server', TITLE_SHORT: 'TM MZ', SERVER_NAME: 'Meenzer-Server'}))
      .to.deep.eq({titleLong: 'TM | Meenzer-Server', titleShort: 'TM MZ', name: 'Meenzer-Server'});
  });

  it('writes title and meta tags into the head, escaped', () => {
    const html = withServerIdentity('<html><head></head><body></body></html>', {titleLong: 'A & "B"', titleShort: '<S>', name: ''});
    expect(html).to.contain('<title>A &amp; &quot;B&quot;</title>');
    expect(html).to.contain('<meta name="server-title-short" content="&lt;S&gt;" />');
    expect(html).to.contain('<meta name="server-name" content="" />');
    expect(html.indexOf('<title>')).to.be.lessThan(html.indexOf('</head>'));
  });
});
