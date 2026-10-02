import {expect} from 'chai';
import {isLocalNetworkHost} from '../../../src/common/admin/isLocalNetworkHost';

describe('isLocalNetworkHost', () => {
  it('home network and this machine are local', () => {
    for (const host of ['192.168.178.77:17745', '192.168.178.77', 'localhost:8080', '127.0.0.1', '10.0.0.5', '172.20.1.2', '[::1]:8080', 'mint.local']) {
      expect(isLocalNetworkHost(host), host).is.true;
    }
  });

  it('public names and addresses are not', () => {
    for (const host of ['gww20.duckdns.org:17745', 'meenz.duckdns.org', '95.89.84.26', '172.32.0.1', '192.169.0.1', '', undefined]) {
      expect(isLocalNetworkHost(host), String(host)).is.false;
    }
  });
});
