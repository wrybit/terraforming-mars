// Variables set when the process is started (shell, docker -e) win over every file: remember them before dotenv adds its own
const launchEnvironmentKeys = new Set(Object.keys(process.env));
require('dotenv').config({quiet: true});
// The settings file the admin page edits (in Docker the mounted .env, serverSettingsFile.ts); before any module reads them
require('./admin/serverSettingsFile').applyServerSettings(launchEnvironmentKeys);
