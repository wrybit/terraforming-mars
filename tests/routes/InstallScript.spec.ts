import {expect} from 'chai';
import {InstallScript} from '../../src/server/routes/InstallScript';
import {MockResponse} from './HttpMocks';
import {RouteTestScaffolding} from './RouteTestScaffolding';

describe('InstallScript', () => {
  it('picks the file by route and client', () => {
    expect(InstallScript.fileFor('install', 'curl/8.7.1')).eq('launcher.sh');
    expect(InstallScript.fileFor('install', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; de-DE) WindowsPowerShell/5.1.26100')).eq('install.ps1');
    expect(InstallScript.fileFor('install', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26100; de-DE) PowerShell/7.5.0')).eq('install.ps1');
    expect(InstallScript.fileFor('install', undefined)).eq('launcher.sh');
    expect(InstallScript.fileFor('install/install.sh', 'PowerShell/7.5.0')).eq('install.sh');
    expect(InstallScript.fileFor('install/install.ps1', 'curl/8.7.1')).eq('install.ps1');
  });

  it('serves the launcher to curl as plain text', async () => {
    const scaffolding = new RouteTestScaffolding();
    const res = new MockResponse();
    scaffolding.url = '/install';
    scaffolding.req.headers['user-agent'] = 'curl/8.7.1';
    await scaffolding.get(InstallScript.INSTANCE, res);
    expect(res.statusCode).eq(200);
    expect(res.headers.get('Content-Type')).eq('text/plain; charset=utf-8');
    expect(res.content).contains('#!/bin/sh');
    expect(res.content).contains('scripts/install/install.sh');
  });

  it('serves install.ps1 to PowerShell', async () => {
    const scaffolding = new RouteTestScaffolding();
    const res = new MockResponse();
    scaffolding.url = '/install';
    scaffolding.req.headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0) PowerShell/7.5.0';
    await scaffolding.get(InstallScript.INSTANCE, res);
    expect(res.content).contains('Get-NodeMajor');
  });
});
