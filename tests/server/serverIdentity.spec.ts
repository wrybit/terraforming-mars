import {expect} from 'chai';
import {serverIdentity, withManifestIdentity, withServerIdentity} from '../../src/server/server/serverIdentity';

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

  it('uses the short title as home screen name', () => {
    const identity = {titleLong: 'TM | Meenzer-Server', titleShort: 'TM MZ', name: ''};
    expect(withServerIdentity('<head><meta name="apple-mobile-web-app-title" content="TM Mars" /></head>', identity))
      .to.contain('<meta name="apple-mobile-web-app-title" content="TM MZ" />');
    const manifest = JSON.parse(withManifestIdentity('{"name": "Terraforming Mars", "short_name": "TM Mars", "scope": "/"}', identity));
    expect(manifest).to.deep.eq({name: 'TM | Meenzer-Server', short_name: 'TM MZ', scope: '/'});
  });
});
