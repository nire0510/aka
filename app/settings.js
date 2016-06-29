'use strict';

var app = require('../config/app.json');
var colors = require('colors');
var dict = require('../config/dictionary.json');
var path = require('path');
var storage = require('node-persist');
var settings;

// create & initialize storage:
try {
  settings = storage.create({
    dir: app.settingsDirectoryName
  });
  settings.initSync();

  // Migrate

  // Add setting key for private aliases if it doesn't exist:
  if (!settings.keys().some((strKey) => strKey === app.privateAliasesDirectoryPathKeyName)) {
    settings.setItemSync(app.privateAliasesDirectoryPathKeyName,
      path.join(process.env.HOME, app.privateAliasesDirectoryName));
  }
  // Add setting key for public aliases if it doesn't exist:
  if (!settings.keys().some((strKey) => strKey === app.publicAliasesDirectoryPathKeyName)) {
    settings.setItemSync(app.publicAliasesDirectoryPathKeyName,
      path.join(process.env.PWD, app.publicAliasesDirectoryName));
  }
} catch (e) {
  console.log('SETTINGS:', dict.program.setup.messages.storagefailed.red);
}

module.exports = settings;
