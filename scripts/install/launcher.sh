#!/bin/sh
# Entry for `curl https://<server>/install | sh` (served by routes/InstallScript.ts).
# Plain POSIX sh, because `sh` is not bash on Debian/Ubuntu: loads install.sh and runs it with bash.
set -e

INSTALLER_URL="https://raw.githubusercontent.com/wrybit/terraforming-mars/main/scripts/install/install.sh"

if ! command -v bash >/dev/null 2>&1; then
  echo "The installer needs bash. Install it (e.g. apt install bash) and run the command again." >&2
  exit 1
fi

script="$(mktemp)"
trap 'rm -f "$script"' EXIT
curl -fsSL "$INSTALLER_URL" -o "$script"
bash "$script" "$@"
