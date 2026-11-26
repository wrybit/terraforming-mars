import {expect} from 'chai';
import {compareAiVersions} from '../../../src/common/ai/rustAiUpdate';
import {GitHubRelease, newestRustAiPackage, newestRustAiVersion, rustAiPackageSystem} from '../../../src/server/ai/rust/rustAiReleases';

function release(version: string, systems: ReadonlyArray<string>, extra: Partial<GitHubRelease> = {}): GitHubRelease {
  const assets = systems.flatMap((system) => {
    const name = `rust-ai-${version}-${system}.tar.gz`;
    return [{name, browser_download_url: `https://example.test/${name}`}, {name: `${name}.sha256`, browser_download_url: `https://example.test/${name}.sha256`}];
  });
  return {tag_name: `rust-ai-${version}`, assets, ...extra};
}

describe('rustAiReleases', () => {
  it('compares versions as numbers, so 1.10 is newer than 1.9', () => {
    expect(compareAiVersions('1.10', '1.9')).gt(0);
    expect(compareAiVersions('1.9', '1.10')).lt(0);
    expect(compareAiVersions('1.10', '1.10')).eq(0);
    expect(compareAiVersions('2.0', '1.99')).gt(0);
  });

  it('names this system like the release packages', () => {
    expect(rustAiPackageSystem('linux', 'x64')).eq('linux-x64');
    expect(rustAiPackageSystem('darwin', 'arm64')).eq('macos-arm64');
    expect(rustAiPackageSystem('win32', 'x64')).eq('windows-x64');
    expect(rustAiPackageSystem('freebsd', 'x64')).is.undefined;
    expect(rustAiPackageSystem('linux', 'ia32')).is.undefined;
  });

  it('picks the newest release, not the first in the list, and skips drafts, pre-releases and other tags', () => {
    const releases = [
      release('1.9', ['linux-x64']),
      release('1.12', ['linux-x64'], {draft: true}),
      release('1.11', ['linux-x64'], {prerelease: true}),
      {tag_name: 'v2.0', assets: []},
      release('1.10', ['linux-x64', 'windows-x64']),
    ];
    expect(newestRustAiVersion(releases)).eq('1.10');
    expect(newestRustAiPackage(releases, 'windows-x64')).deep.eq({
      version: '1.10',
      archiveName: 'rust-ai-1.10-windows-x64.tar.gz',
      archiveUrl: 'https://example.test/rust-ai-1.10-windows-x64.tar.gz',
      checksumUrl: 'https://example.test/rust-ai-1.10-windows-x64.tar.gz.sha256',
    });
  });

  it('has no package when the newest release lacks this system, even if an older one has it', () => {
    const releases = [release('1.10', ['linux-x64']), release('1.9', ['macos-arm64'])];
    expect(newestRustAiPackage(releases, 'macos-arm64')).is.undefined;
  });
});
