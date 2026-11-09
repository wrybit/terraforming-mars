import {expect, use} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {assertPublicUrl, isPublicIpAddress} from '../../src/server/admin/publicAddress';
use(chaiAsPromised);

describe('publicAddress', () => {
  it('tells public from internal IPv4 addresses', () => {
    for (const address of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.178.20', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1']) {
      expect(isPublicIpAddress(address), address).is.false;
    }
    for (const address of ['8.8.8.8', '130.61.81.138', '172.32.0.1', '192.169.0.1']) {
      expect(isPublicIpAddress(address), address).is.true;
    }
  });

  it('tells public from internal IPv6 addresses', () => {
    for (const address of ['::1', '::', 'fe80::1', 'fd00::1', 'fc12::1', 'ff02::1', '::ffff:192.168.0.1']) {
      expect(isPublicIpAddress(address), address).is.false;
    }
    for (const address of ['2a01:4f8::1', '::ffff:8.8.8.8']) {
      expect(isPublicIpAddress(address), address).is.true;
    }
  });

  it('refuses links to internal hosts, also by name', async () => {
    const resolve = async (hostname: string) => hostname === 'tm.example.org' ? ['93.184.216.34'] : ['192.168.178.20'];
    await expect(assertPublicUrl('https://tm.example.org/api/player', resolve)).is.fulfilled;
    await expect(assertPublicUrl('http://mint.local:8080/api/player', resolve)).is.rejected;
    await expect(assertPublicUrl('http://127.0.0.1:8080/api/player', resolve)).is.rejected;
    await expect(assertPublicUrl('http://[::1]:8080/api/player', resolve)).is.rejected;
  });

  it('refuses a host that resolves to a public and an internal address', async () => {
    await expect(assertPublicUrl('https://mixed.example.org/', async () => ['93.184.216.34', '10.0.0.1'])).is.rejected;
  });
});
