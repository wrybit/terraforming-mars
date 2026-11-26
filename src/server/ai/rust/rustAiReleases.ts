import {RUST_AI_RELEASE_PREFIX, compareAiVersions} from '../../../common/ai/rustAiUpdate';

/** The part of a GitHub release (api.github.com/repos/…/releases) the update needs. */
export type GitHubRelease = {
  tag_name?: string,
  draft?: boolean,
  prerelease?: boolean,
  assets?: ReadonlyArray<{name: string, browser_download_url: string}>,
};

export type RustAiPackage = {version: string, archiveName: string, archiveUrl: string, checksumUrl: string};

const SYSTEMS: Record<string, string> = {linux: 'linux', darwin: 'macos', win32: 'windows'};

/**
 * Name of this system in the release packages (rust-ai-<version>-<system>-<cpu>.tar.gz), the same as the installer's
 * (scripts/install/wizard/platform.mjs). In Docker the container is Linux, so the Linux package is picked there.
 */
export function rustAiPackageSystem(platform: string = process.platform, arch: string = process.arch): string | undefined {
  const system = SYSTEMS[platform];
  return system !== undefined && (arch === 'x64' || arch === 'arm64') ? `${system}-${arch}` : undefined;
}

function releaseVersion(release: GitHubRelease): string | undefined {
  const tag = release.tag_name ?? '';
  return tag.startsWith(RUST_AI_RELEASE_PREFIX) && release.draft !== true && release.prerelease !== true ?
    tag.slice(RUST_AI_RELEASE_PREFIX.length) : undefined;
}

/** Version of the newest published Rust AI release, whether or not it has a package for this system. */
export function newestRustAiVersion(releases: ReadonlyArray<GitHubRelease>): string | undefined {
  return releases.map(releaseVersion).filter((version): version is string => version !== undefined)
    .sort(compareAiVersions).pop();
}

/** Package of the newest release for this system, with its checksum file; undefined if that release has none. */
export function newestRustAiPackage(releases: ReadonlyArray<GitHubRelease>, system: string): RustAiPackage | undefined {
  const version = newestRustAiVersion(releases);
  const release = releases.find((candidate) => releaseVersion(candidate) === version);
  const assets = release?.assets ?? [];
  const archive = assets.find((asset) => asset.name.endsWith(`-${system}.tar.gz`));
  const checksum = assets.find((asset) => asset.name === `${archive?.name}.sha256`);
  if (version === undefined || archive === undefined || checksum === undefined) {
    return undefined;
  }
  return {version, archiveName: archive.name, archiveUrl: archive.browser_download_url, checksumUrl: checksum.browser_download_url};
}
