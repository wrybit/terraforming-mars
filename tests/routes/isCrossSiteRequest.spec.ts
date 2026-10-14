import {expect} from 'chai';
import {isCrossSiteRequest} from '../../src/server/routes/isCrossSiteRequest';
import {MockRequest} from './HttpMocks';

function request(headers: {[x: string]: string}): MockRequest {
  const req = new MockRequest();
  req.headers = {host: 'tm.example.org', ...headers};
  return req;
}

describe('isCrossSiteRequest', () => {
  it('lets requests from our own pages pass', () => {
    expect(isCrossSiteRequest(request({origin: 'https://tm.example.org'}))).is.false;
    expect(isCrossSiteRequest(request({referer: 'https://tm.example.org/admin'}))).is.false;
  });

  it('lets scripts without Origin and Referer pass', () => {
    expect(isCrossSiteRequest(request({}))).is.false;
  });

  it('flags requests from other sites', () => {
    // Also sibling subdomains: SameSite cookies would still be sent from there
    expect(isCrossSiteRequest(request({origin: 'https://other.example.org'}))).is.true;
    expect(isCrossSiteRequest(request({referer: 'https://evil.test/form'}))).is.true;
    expect(isCrossSiteRequest(request({origin: 'null'}))).is.true;
    expect(isCrossSiteRequest(request({origin: 'not a url'}))).is.true;
  });

  it('prefers Origin over Referer', () => {
    expect(isCrossSiteRequest(request({origin: 'https://evil.test', referer: 'https://tm.example.org/'}))).is.true;
  });
});
