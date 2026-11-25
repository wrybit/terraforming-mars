# Terraforming Mars installer for Windows (PowerShell 5.1 or newer).
#
#   irm https://raw.githubusercontent.com/wrybit/terraforming-mars/main/scripts/install/install.ps1 | iex
#
# Checks Git and Node 22, installs what is missing with winget after asking, then starts the wizard
# (scripts/install/wizard/installer.mjs), which asks everything else.
$ErrorActionPreference = 'Stop'

$RepositoryUrl = 'https://github.com/wrybit/terraforming-mars.git'
$NodeMajor = '22'

function Write-Failure($message) {
  Write-Host "X $message" -ForegroundColor Red
  exit 1
}

function Confirm-Install($question) {
  # No console (agent, CI): install the requirements without asking
  if (-not [Environment]::UserInteractive -or [Console]::IsInputRedirected) { return $true }
  $reply = Read-Host "? $question [Y/n]"
  return ($reply -eq '' -or $reply -match '^[Yy]')
}

# After winget the running session only finds new programs once PATH is read again
function Update-SessionPath {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}

function Get-NodeMajor {
  if (Get-Command node -ErrorAction SilentlyContinue) {
    return (node -p "process.versions.node.split('.')[0]")
  }
  return '0'
}

function Use-Fnm {
  fnm env --shell power-shell | Out-String | Invoke-Expression
  fnm install $NodeMajor
  fnm use $NodeMajor
  fnm default $NodeMajor
}

# Stays silent while everything is there, so the wizard starts with its own header
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
  if (-not (Get-Command git -ErrorAction SilentlyContinue) -or (Get-NodeMajor) -ne $NodeMajor) {
    Write-Failure 'winget is missing. Install "App Installer" from the Microsoft Store, or install Git and Node.js 22 yourself.'
  }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  if (-not (Confirm-Install 'Git is missing. Install it now?')) { Write-Failure 'Git is required.' }
  winget install --id Git.Git --exact --silent --accept-package-agreements --accept-source-agreements
  Update-SessionPath
}

if ((Get-NodeMajor) -ne $NodeMajor -and (Get-Command fnm -ErrorAction SilentlyContinue)) {
  try { Use-Fnm } catch { }
}
if ((Get-NodeMajor) -ne $NodeMajor) {
  $found = if (Get-Command node -ErrorAction SilentlyContinue) { node --version } else { 'none' }
  if (-not (Confirm-Install "Node.js $NodeMajor is needed (found: $found). Install it now with fnm?")) { Write-Failure "Node.js $NodeMajor is required." }
  winget install --id Schniz.fnm --exact --silent --accept-package-agreements --accept-source-agreements
  Update-SessionPath
  Use-Fnm
}

# Use the wizard of this checkout, or fetch only the installer folder from GitHub
$Wizard = $null
if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot 'wizard\installer.mjs'))) {
  $Wizard = Join-Path $PSScriptRoot 'wizard\installer.mjs'
} else {
  $Temporary = Join-Path ([IO.Path]::GetTempPath()) ("tm-installer-" + [Guid]::NewGuid())
  git clone --quiet --depth 1 --filter=blob:none --sparse $RepositoryUrl "$Temporary\source"
  git -C "$Temporary\source" sparse-checkout set scripts/install
  $Wizard = "$Temporary\source\scripts\install\wizard\installer.mjs"
  # The wizard must not mistake this temporary folder for an existing installation
  $env:TM_INSTALLER_STANDALONE = '1'
}

try {
  node $Wizard @args
} finally {
  if ($Temporary) { Remove-Item -Recurse -Force $Temporary -ErrorAction SilentlyContinue }
}
