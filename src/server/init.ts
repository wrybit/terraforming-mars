require('dotenv').config({quiet: true});
// Settings changed on the admin page override the .env values (serverSettingsFile.ts); before any module reads them
require('./admin/serverSettingsFile').applySavedServerSettings();
