# Installer

Interactive installer for this fork. Full guide: wiki page **Installation**.

| System | Command |
|---|---|
| Linux / macOS | `curl -fsSL https://raw.githubusercontent.com/wrybit/terraforming-mars/main/scripts/install/install.sh \| bash` |
| Windows (PowerShell) | `irm https://raw.githubusercontent.com/wrybit/terraforming-mars/main/scripts/install/install.ps1 \| iex` |
| From a checkout | `bash scripts/install/install.sh` or `node scripts/install/wizard/installer.mjs` |

Update: start it again in the folder of the installation. It shows the installed and the newest version (game and Rust AI) and updates with one choice, without the installation questions. Without a terminal: `--update`.

Try every screen without installing anything: `node scripts/install/wizard/installer.mjs --demo`

Without questions (scripts, AI agents): `node scripts/install/wizard/installer.mjs --help`

## Files

| File | Purpose |
|---|---|
| `install.sh` / `install.ps1` | Check Git + Node 22, install them if missing, start the wizard |
| `wizard/installer.mjs` | Entry: questions → summary → install |
| `wizard/questions.mjs` | All questions (menu and command-line options use the same list) |
| `wizard/update.mjs` | Update of an existing installation: panel with installed vs. newest, update steps |
| `wizard/prompts.mjs`, `terminal.mjs` | Arrow-key menus and text input, no dependencies |
| `wizard/ui/` | Colors, boxes, planet header, step checklist |
| `wizard/demo/` | `--demo`: choose a situation, steps are only simulated |
| `wizard/steps/` | Download, `.env`, build, Rust AI, health check, installed state, install record |
| `wizard/services/` | Run modes: systemd, launchd, Windows task, Docker, foreground |
