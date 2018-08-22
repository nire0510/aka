'use strict';

var app = require('../config/app.json');
var colors = require('colors');
var dict = require('../config/dictionary.json');
var path = require('path');
var os = require('os');
var storage = require('node-persist');
var settings;

// create & initialize storage:
try {  
  settings = storage.create({
    dir: path.join(os.homedir(), app.settingsDirectoryName)
  });
  settings.initSync();

  // Add setting key for private aliases if it doesn't exist:
  if (!settings.keys().some((strKey) => strKey === app.privateAliasesDirectoryPathKeyName)) {
    settings.setItemSync(app.privateAliasesDirectoryPathKeyName,
      path.join(os.homedir(), app.privateAliasesDirectoryName));
  }
  // Add setting key for public aliases if it doesn't exist:
  if (!settings.keys().some((strKey) => strKey === app.publicAliasesDirectoryPathKeyName)) {
    let execSync = require('child_process').execSync,
      strModulePath = `${execSync('npm root -g')}/as-known-as`.replace(/\n/g, '');

    settings.setItemSync(app.publicAliasesDirectoryPathKeyName,
      path.join(strModulePath, app.publicAliasesDirectoryName));
  }
} catch (e) {  
  console.log('SETTINGS:', dict.program.setup.messages.storagefailed.red);
  process.exit(0);
}

module.exports = settings;
