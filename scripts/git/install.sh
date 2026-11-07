#!/usr/bin/env bash
# Once per clone (Mac, AK1 build directory): hooks from scripts/git/hooks and the JSON merge driver for the
# translation files (.gitattributes). Git keeps both in the local config only, so every clone needs this.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
git config core.hooksPath scripts/git/hooks
git config merge.json-union.name "Merge translation JSON entry by entry"
# Absolute path: also works in worktrees of commits that do not have the script yet
git config merge.json-union.driver "python3 $(pwd)/scripts/git/json-merge-driver.py %O %A %B"
echo "Installed: pre-push check and JSON merge driver"
