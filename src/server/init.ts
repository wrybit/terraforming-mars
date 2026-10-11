require('dotenv').config({quiet: true});
// The settings file the admin page edits (in Docker the mounted .env, serverSettingsFile.ts); before any module reads them
require('./admin/serverSettingsFile').applyServerSettings();
