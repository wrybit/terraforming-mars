import {expect} from 'chai';
import {clientAddress} from '../../src/server/server/clientAddress';
import {Request} from '../../src/server/Request';

function request(remoteAddress: string, forwardedFor?: string | Array<string>): Request {
  const headers = forwardedFor === undefined ? {} : {'x-forwarded-for': forwardedFor};
  return {socket: {remoteAddress}, headers} as unknown as Request;
}

describe('clientAddress', () => {
  it('uses the connection address without a proxy header', () => {
    expect(clientAddress(request('203.0.113.7'))).eq('203.0.113.7');
    expect(clientAddress(request('::ffff:203.0.113.7'))).eq('203.0.113.7');
  });

  it('ignores X-Forwarded-For from a client that is not a proxy', () => {
    // Otherwise every request could claim a new address and slip past quotas and login throttling
    expect(clientAddress(request('203.0.113.7', '198.51.100.1'))).eq('203.0.113.7');
    expect(clientAddress(request('192.168.178.20', '198.51.100.1'))).eq('192.168.178.20');
  });

  it('takes the last X-Forwarded-For entry from a local proxy', () => {
    // Caddy (loopback) and Nginx Proxy Manager (Docker network) append the real address at the end
    expect(clientAddress(request('127.0.0.1', '198.51.100.1'))).eq('198.51.100.1');
    expect(clientAddress(request('::ffff:172.17.0.1', '1.2.3.4, 198.51.100.1'))).eq('198.51.100.1');
    expect(clientAddress(request('172.18.0.5', ['1.2.3.4', '198.51.100.1']))).eq('198.51.100.1');
  });

  it('falls back to the connection address when the proxy header holds no address', () => {
    expect(clientAddress(request('127.0.0.1', 'not-an-address'))).eq('127.0.0.1');
    expect(clientAddress(request('127.0.0.1'))).eq('127.0.0.1');
  });
});
