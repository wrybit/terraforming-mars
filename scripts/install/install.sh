#!/usr/bin/env bash
# Terraforming Mars installer for Linux and macOS.
#
#   curl -fsSL https://raw.githubusercontent.com/wrybit/terraforming-mars/main/scripts/install/install.sh | bash
#
# Checks Git and Node 22, installs what is missing after asking, then starts the wizard
# (scripts/install/wizard/installer.mjs), which asks everything else. Options are passed on,
# e.g. `bash install.sh --help`.
set -euo pipefail

REPOSITORY_URL="https://github.com/wrybit/terraforming-mars.git"
NODE_MAJOR=22

fail() { printf '\033[31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

# With `curl | bash` stdin is the pipe, so questions are always read from the terminal
TERMINAL=/dev/tty
if ! { : <"$TERMINAL"; } 2>/dev/null; then
  TERMINAL=""
fi

ask_yes() {
  local question=$1
  if [ -z "$TERMINAL" ]; then
    return 0  # Ohne Terminal (Agent, CI): Voraussetzungen ohne Rückfrage installieren
  fi
  printf '? %s [Y/n] ' "$question"
  local reply
  read -r reply <"$TERMINAL" || reply=""
  [[ -z "$reply" || "$reply" =~ ^[Yy] ]]
}

as_root() {
  if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi
}

install_git() {
  case "$(uname -s)" in
    Darwin)
      if command -v brew >/dev/null; then brew install git; else xcode-select --install; fail "Finish the Xcode tools installation, then run the installer again."; fi ;;
    Linux)
      if command -v apt-get >/dev/null; then as_root apt-get update && as_root apt-get install -y git curl
      elif command -v dnf >/dev/null; then as_root dnf install -y git curl
      elif command -v pacman >/dev/null; then as_root pacman -Sy --noconfirm git curl
      elif command -v zypper >/dev/null; then as_root zypper install -y git curl
      else fail "Please install git yourself."; fi ;;
  esac
}

node_major() {
  command -v node >/dev/null && node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0
}

# fnm installs Node without admin rights and works the same on Linux, macOS and Windows
install_node() {
  if ! command -v fnm >/dev/null; then
    if [ "$(uname -s)" = Darwin ] && command -v brew >/dev/null; then
      brew install fnm
    else
      command -v unzip >/dev/null || { [ "$(uname -s)" = Linux ] && command -v apt-get >/dev/null && as_root apt-get install -y unzip; } || true
      curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell
      export PATH="$HOME/.local/share/fnm:$HOME/.fnm:$PATH"
    fi
  fi
  eval "$(fnm env)"
  fnm install "$NODE_MAJOR"
  fnm use "$NODE_MAJOR"
  fnm default "$NODE_MAJOR"
}

# Stays silent while everything is there, so the wizard starts with its own header
if ! command -v git >/dev/null; then
  ask_yes "Git is missing. Install it now?" || fail "Git is required."
  install_git
fi

if [ "$(node_major)" != "$NODE_MAJOR" ]; then
  if command -v fnm >/dev/null || [ -d "$HOME/.local/share/fnm" ]; then
    export PATH="$HOME/.local/share/fnm:$PATH"
    eval "$(fnm env)" && fnm use "$NODE_MAJOR" >/dev/null 2>&1 || true
  fi
fi
if [ "$(node_major)" != "$NODE_MAJOR" ]; then
  ask_yes "Node.js $NODE_MAJOR is needed (found: $(node --version 2>/dev/null || echo none)). Install it now with fnm?" || fail "Node.js $NODE_MAJOR is required."
  install_node
fi

# Use the wizard of this checkout, or fetch only the installer folder from GitHub
SCRIPT_DIRECTORY=""
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
  SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi
if [ -n "$SCRIPT_DIRECTORY" ] && [ -f "$SCRIPT_DIRECTORY/wizard/installer.mjs" ]; then
  WIZARD="$SCRIPT_DIRECTORY/wizard/installer.mjs"
else
  TEMPORARY="$(mktemp -d)"
  trap 'rm -rf "$TEMPORARY"' EXIT
  git clone --quiet --depth 1 --filter=blob:none --sparse "$REPOSITORY_URL" "$TEMPORARY/source"
  git -C "$TEMPORARY/source" sparse-checkout set scripts/install
  WIZARD="$TEMPORARY/source/scripts/install/wizard/installer.mjs"
  # The wizard must not mistake this temporary folder for an existing installation
  export TM_INSTALLER_STANDALONE=1
fi

if [ -n "$TERMINAL" ]; then
  node "$WIZARD" "$@" <"$TERMINAL"
else
  node "$WIZARD" "$@"
fi
